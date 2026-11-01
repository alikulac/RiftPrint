/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/controller/ChangeOperations",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/StatusCommon"
	],
	function (BaseViewChildController, ChangeOperations, Constants, StatusCommon) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.actions.ChangeOperations.controller", {
			onInitMembers: function () {
				this.oChangeOperationsDelegate = undefined;
				this.oStatusCommon = new StatusCommon(Constants.sAfterStatusChangesFinalizedGanttApp);
			},

			onExit: function () {
				this.oStatusCommon.destructor();
			},

			change: function (oEvent, oMenuShape) {
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.subscribe(Constants.sLibraryChannel, Constants.sServerMessageToUpdateEntity, this._afterChangeOperations, this);
				oEventBus.subscribeOnce(
					Constants.sLibraryChannel,
					Constants.sAfterMassChangeDialogClosed,
					function () {
						oEventBus.unsubscribe(Constants.sLibraryChannel, Constants.sServerMessageToUpdateEntity, this._afterChangeOperations, this);
					},
					this
				);

				this.oChangeOperationsDelegate = new ChangeOperations();
				sap.ui.getCore().getMessageManager().registerObject(this.oChangeOperationsDelegate.getFragment(), true);
				var oTimePeriod = this.controllers.timePeriod.get();
				this.oChangeOperationsDelegate.setContentToFragment(
					oEvent,
					this.oComponent,
					this.controllers.board.getView(), // some ugly hack to be cleaned up together with the dialog (which should use something else to differ the apps)
					this.oStatusCommon,
					oTimePeriod,
					oMenuShape,
					true
				);
			},

			// why is this function not using the submit controller?
			// the change operations dialog sets the same groupId. that seems ok.
			// but the event sServerMessageToUpdateEntity is fired also by event handling. this is unclear yet.
			_afterChangeOperations: function (sChannel, sEvent, oTargetParams) {
				var pRefresh = this.controllers.deltaRefresh.refresh(oTargetParams);
				var pSubmit = this.controllers.modelPromises.submitChanges({ groupId: oTargetParams.parameters.sGroupId });
				Promise.all([pRefresh, pSubmit]).then(
					function () {
						this.byId("idOrderGanttContainer").setBusy(false);
						this.oChangeOperationsDelegate.onCloseDialog();
					}.bind(this)
				);
			}
		});
	}
);
