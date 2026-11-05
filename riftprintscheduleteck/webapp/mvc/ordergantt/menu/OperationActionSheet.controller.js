/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseFragment.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/menus/DateTimePopup",
		"sap/gantt/misc/Utility",
		"sap/ui/core/date/UI5Date",
		"sap/m/Label",
		"sap/ui/core/Popup"
	],
	function (BaseFragmentController, Constants, Utils, DateTimePopup, Utility, UI5Date, Label, Popup) {
		"use strict";

		return BaseFragmentController.extend("rsh.eam.ordergantts1.mvc.ordergantt.menu.OperationActionSheet.controller", {
			constructor: function (oComponent, oView, oGanttChart) {
				BaseFragmentController.call(this, {
					component: oComponent,
					dependent: oView,
					fragmentName: "rsh.eam.ordergantts1.mvc.ordergantt.menu.OperationActionSheet",
					fragmentId: oView.getId(),
					ganttChart: oGanttChart
				});
			},

			onInitMembers: function (oParams) {
				this._oGanttChartWithTable = oParams.ganttChart;
				this._oShape = undefined;
				this._bActionFromMenu = false;
				this._iPageX = undefined;
				this._iPageY = undefined;
				this._sOperationStartDateProperty = "OrderOperationStartDateTime";
			},

			isActionFromMenu: function () {
				return this._bActionFromMenu;
			},

			resetActionFromMenu: function () {
				this._bActionFromMenu = false;
			},

			// before cleanup: closeContextMenus
			close: function () {
				if (this._oFragment && this._oFragment.isOpen()) {
					this._oFragment.close();
				}
			},

			// before cleanup: onShapeContextMenu
			open: function (oEvent) {
				this._oShape = oEvent.getParameter("shape");
				this._iPageX = oEvent.getParameter("pageX");
				this._iPageY = oEvent.getParameter("pageY");
				var oControl = this._oGanttChartWithTable.fullScreenMode() ? this._oGanttChartWithTable.getParent() : null;
				var oOrdersAndOps = this._oShape.getBindingContext().getObject();

				var bInProcess = oOrdersAndOps.ProcessingStatus === Constants.inProcessCode;
				if (bInProcess) {
					var sMessage = this.oBundle.getText("InfoMessageOperationInProcessStatus");
					this.controllers.message.addMessage(sMessage, "Information", "Toast");
				} else {
					this.getFragment().then(
						function () {
							this._setVisibilities(
								oOrdersAndOps.ProcessingStatus,
								oOrdersAndOps.OpBscStartDateConstraintType,
								oOrdersAndOps.NumberOfAssignedPersons,
								oOrdersAndOps.MaintenanceOrderSubOperation,
								oOrdersAndOps.OperationPersonResponsible
							);
							this._open(oControl);
						}.bind(this)
					);
				}
			},

			// before cleanup: _openOperationShapeContextMenu
			_open: function (oControl) {
				//Placeholder to display the operatoin actionsheet next to the mouse cursor
				var oPlaceHolder = new Label();
				var oPopup = new Popup(oPlaceHolder, false, true, false);
				var eDock = Popup.Dock;
				//Setting the offset to display the operation context menu fragment next to the mouse cursor
				var sOffset = this._iPageX + 1 + " " + (this._iPageY - 15);
				oPopup.open(0, eDock.BeginTop, eDock.LeftTop, oControl, sOffset);
				this._oFragment.openBy(oPlaceHolder);
			},

			// before cleanup: _setupOperationShapeContextMenu
			_setVisibilities: function (iOpProcessingStatus, sOpBscStartDateConstraintType, sNumberOfAssignedPersons, sMaintenanceOrderSubOperation, sOperationPersonResponsible) {
				if (iOpProcessingStatus === Constants.dueStatusCode) {
					this.byId("idButtonChangeAction").setProperty("visible", true);
					this.byId("idButtonDispatchAction").setProperty("visible", true);
					this.byId("idButtonCancDispatchAction").setProperty("visible", false);
				} else if (iOpProcessingStatus === Constants.dispatchedStatusCode) {
					this.byId("idButtonChangeAction").setProperty("visible", true);
					this.byId("idButtonDispatchAction").setProperty("visible", false);
					this.byId("idButtonCancDispatchAction").setProperty("visible", true);
				}
				if (sOpBscStartDateConstraintType === "1") {
					this.byId("idButtonRemoveConstraintsAction").setProperty("visible", true);
				} else {
					this.byId("idButtonRemoveConstraintsAction").setProperty("visible", false);
				}
				var bSplitExisits = sNumberOfAssignedPersons !== "0" && sNumberOfAssignedPersons !== " 0";
				this.byId("idButtonUnassignAction").setProperty("visible", bSplitExisits);
				var bIsNotASubOperation = sMaintenanceOrderSubOperation === "" || sMaintenanceOrderSubOperation === undefined;
				this.byId("idSetPlannedStartAction").setProperty("visible", bIsNotASubOperation);
				var bPersonResponsibleAssigned = sOperationPersonResponsible !== Constants.idUnassignedPersonResponsible;
				this.byId("idButtonUnassignPersonResponsibleAction").setProperty("visible", bPersonResponsibleAssigned);
			},

			onChangeOperationsButton: function (oEvent) {
				this._bActionFromMenu = true;
				this.controllers.ordergantt.changeOperations.change(oEvent, this._oShape);
			},

			onDispatchButton: function (oEvent) {
				this._bActionFromMenu = true;
				this.controllers.ordergantt.dispatchOperations.dispatch(this._oShape);
			},

			onCancDispatchButton: function (oEvent) {
				this._bActionFromMenu = true;
				this.controllers.ordergantt.dispatchOperations.cancelDispatch(this._oShape);
			},

			onRemoveConstraintsButton: function (oEvent) {
				this._bActionFromMenu = true;
				this.controllers.ordergantt.dispatchOperations.removeConstraints(this._oShape);
			},

			onAssignButton: function (oEvent) {
				this._bActionFromMenu = true;
				var aShapePaths = this._getShapePaths(this._oShape);
				this.controllers.ordergantt.assignPeople.assign(aShapePaths);
			},

			onUnassignButton: function (oEvent) {
				this._bActionFromMenu = true;
				var aShapePaths = this._getShapePaths(this._oShape);
				this.controllers.ordergantt.assignPeople.unassign(aShapePaths);
			},

			onAssignPersonResponsibleButton: function () {
				this._bActionFromMenu = true;
				var aShapePaths = this._getShapePaths(this._oShape);
				this.controllers.ordergantt.assignPersonResponsible.assign(aShapePaths);
			},

			onUnassignPersonResponsibleButton: function () {
				this._bActionFromMenu = true;
				var aShapePaths = this._getShapePaths(this._oShape);
				this.controllers.ordergantt.assignPersonResponsible.unassign(aShapePaths);
			},

			onSetPlannedStart: function (oEvent) {
				if (!this.oDateTimePopup) {
					this.oDateTimePopup = new DateTimePopup();
				}
				
				var sPath = Utility.parseUid(this._oShape.getShapeUid()).shapeDataName;
				var oOperation = this._oShape.getModel().getObject(sPath);
				if (!oOperation.hasOwnProperty(this._sOperationStartDateProperty)) {
					throw Error("Shape does not contain start date property " + this._sOperationStartDateProperty);
				}
				var dDefaultDate = oOperation[this._sOperationStartDateProperty];
				var sCalledFrom = "Operation";

				var dMinDate;
				if (Utils.isMockRun()) {
					// If running OPA5 test, do not disable past dates, because mock data dates are in past and test fails, need to run the test without disabling past dates
					dMinDate = undefined;
				} else {
					// disable past dates
					dMinDate = UI5Date.getInstance();
				}
				this.oDateTimePopup.onOpen(oEvent, this._oDependent, this._oShape, this._iPageX, this._iPageY, sCalledFrom, dDefaultDate, dMinDate).then(
					function (oResult) {
						this.controllers.ordergantt.updateOrderOpDates.onSetPlannedDate(oResult);
					}.bind(this)
				);
			},

			// before cleanup: _openOperationShapeContextMenu
			_getShapePaths: function (oShape) {
				var aShapePaths = [];
				if (!oShape.getSelected()) {
					this._oGanttChartWithTable.deselectShapes(this._oGanttChartWithTable.getSelectedShapeUid());
					// Save only the operation shape on which the right click was performed
					aShapePaths.push(oShape.getBindingContext().getPath());
				} else {
					var aSelectedShapeUid = this._oGanttChartWithTable.getSelectedShapeUid();
					for (var i = 0; i < aSelectedShapeUid.length; i++) {
						var sOpShapePath = Utility.parseUid(aSelectedShapeUid[i]).shapeDataName;
						if (this.oModel.getData(sOpShapePath).OrderOperationRowLevel === 1) {
							aShapePaths.push(sOpShapePath);
						}
					}
				}
				return aShapePaths;
			}
		});
	}
);
