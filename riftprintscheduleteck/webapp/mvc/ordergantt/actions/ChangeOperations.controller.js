/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/order/ChangeOperationsDialog.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/gantt/misc/Utility",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (BaseViewChildController, ChangeOperationsDialogController, Constants, GanttUtility, Utils) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.actions.ChangeOperations.controller", {
			onInitMembers: function () {
				this.controllers.changeOperationsDialog = new ChangeOperationsDialogController({
					component: this.oComponent,
					dependent: this.getView(),
					deferRequest: true
				});
			},

			change: function (oEvent, oMenuShape) {
				var sSourceControlId = oEvent.getSource().getId();
				var aSelectedOperations = this._getSelectedOperations(sSourceControlId, oMenuShape);
				this.controllers.changeOperationsDialog.open(aSelectedOperations).then(
					function (oRefreshParametersOfSourceApp) {
						if (oRefreshParametersOfSourceApp.oTarget) {
							this._afterChangeOperations(oRefreshParametersOfSourceApp.oTarget);
						}
					}.bind(this)
				);
			},

			_afterChangeOperations: function (oTargetParams) {
				this.byId("idOrderGanttContainer").setBusy(true);
				var pRefresh = this.controllers.deltaRefresh.refresh(oTargetParams);
				var pSubmit = this.controllers.modelPromises.submitChanges({groupId: oTargetParams.parameters.sGroupId});
				Promise.all([pRefresh, pSubmit]).then(
					function () {
						this.byId("idOrderGanttContainer").setBusy(false);
					}.bind(this)
				);
			},

			_getSelectedOperations: function (sSourceControlId, oShape) {
				var oOperation;
				var aSelectedOperations = [],
					aOperationsWithinTimePeriod = [];

				if (oShape && sSourceControlId.includes("idButtonChangeAction")) {
					var sShapePath;

					var aSelectedShapes = this.byId("idOrderGanttChartWithTable").getSelectedShapeUid();
					for (var i = 0; i < aSelectedShapes.length; i++) {
						sShapePath = GanttUtility.parseUid(aSelectedShapes[i]).shapeDataName;

						if (sShapePath.indexOf("C_RSHOrdersAndOperations") !== -1) {
							oOperation = this.getModel().getData(sShapePath);
							aSelectedOperations.push(oOperation);
						}
					}
				} else {
					var aSelectedRowBindingsContexts = this.controllers.orderGantt.getSelectedBindingContexts();

					aSelectedRowBindingsContexts.forEach(function (oBindingContext) {
						oOperation = oBindingContext.getObject();
						if (oOperation.OrderOperationRowLevel === 1) {
							aSelectedOperations.push(oOperation);
						}
					});
				}

				var oTimePeriod = this.controllers.timePeriod.get();
				aSelectedOperations.forEach(function (oSelectedOperation) {
					if (oSelectedOperation.HasError === "") {
						// Row Highlight set to 'None' by default
						oSelectedOperation.Highlight = "None";
						if (!Utils.checkIfOperationIsWithinTimePeriod(oSelectedOperation, oTimePeriod)) {
							aOperationsWithinTimePeriod.push(oSelectedOperation);
						}
					}
				});

				return aOperationsWithinTimePeriod;
			}
		});
	}
);
