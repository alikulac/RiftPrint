/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/controller/OrderPopup",
		"sap/rsh/eam/lib/common/controller/OperationPopup",
		"sap/rsh/eam/lib/common/controller/FunctionalLocationPopup",
		"sap/rsh/eam/lib/common/controller/EquipmentPopup",
		"sap/rsh/eam/lib/common/controller/SchedulesPopup",
		"sap/rsh/eam/lib/common/controller/MaintenanceEventPopup",
		"sap/rsh/eam/lib/common/utils/AppState"
	],
	function (
		BaseViewChildController,
		OrderPopup,
		OperationPopup,
		FunctionalLocationPopup,
		EquipmentPopup,
		SchedulesPopup,
		MaintenanceEventPopup,
		AppState
	) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.actions.OpenLinks.controller", {
			onInitMembers: function () {
				this._sOrderAdditionalFields =
					"FunctionalLocationName,FunctionalLocation,EquipmentName,Equipment,MaterialStatusKey,MaterialStatusText,to_OrderActiveStatus,to_OrderDetails";
				this._sOperationFields =
					"MaintenanceOrder,MaintenanceOrderDesc,MaintenanceOrderOperation,MaintenanceOrderSubOperation,Equipment,EquipmentName,FunctionalLocation,FunctionalLocationName,OperationEquipment,OperationEquipmentName,OperationFunctionalLocation,OpFunctionalLocationName,MaintPriority,MaintPriorityDesc,WorkCenterInternalID,OrderOperationStartDateTime,OrderOperationEndDateTime,OrderOpStartConstraintDateTime,OrderOpEndConstraintDateTime,MaintOrdProcessPhaseCode,MaintOrdProcessPhaseDesc,MaintOrdProcessSubPhaseCode,MaintOrdProcessSubPhaseDesc,MaintOrdOpProcessPhaseCode,MaintOrdOpProcessPhaseDesc,MaintOrdOpProcessSubPhaseCode,MaintOrdOpProcessSubPhaseDesc,MaintenancePhaseControlText,MaintOrderOperationInternalID,OrderType,MaintOrderRoutingNumber,ProcessingStatusText,ProcessingStatus,OrderOperationRowID,to_OperationActiveStatus,to_OperationDetails,ActualWorkQuantity,RemainingWorkQuantity";
				this._oOrderPopupDelegate = undefined;
				this._oOperationPopupDelegate = undefined;
				this._oFunctionalLocationPopupDelegate = undefined;
				this._oEquipmentPopupDelegate = undefined;
				this._oMaintEventPopupDelegate = undefined;
				this._oSchedulesPopupDelegate = undefined;
			},

			// before cleanup: SchedulingBoard.handleLinkPress
			openOrderOperation: function (oEvent) {
				var oContext = oEvent.getSource().getBindingContext();
				var oOrderOp = oContext.getObject();
				var bOrder = oOrderOp.OrderOperationRowLevel === 0;
				if (bOrder) {
					this._oOrderPopupDelegate = new OrderPopup();
					sap.ui.getCore().getMessageManager().registerObject(this._oOrderPopupDelegate.getFragment(), true);
					var sFields = this.controllers.ordergantt.fields.getOrderSelectFields() + "," + this._sOrderAdditionalFields;
					this._oOrderPopupDelegate.setContentToFragment(oEvent, this.oComponent, this.getModel("readModel"), sFields);
				} else {
					this._oOperationPopupDelegate = new OperationPopup();
					sap.ui.getCore().getMessageManager().registerObject(this._oOperationPopupDelegate.getFragment(), true);
					this._oOperationPopupDelegate.setContentToFragment(oEvent, this.oComponent, this.getModel("readModel"), this._sOperationFields);
				}
			},

			// before cleanup: SchedulingBoard.handleTechnicalObjectLinkPress
			openTechnicalObject: function (oEvent) {
				var sTechnicalObjectType = oEvent.getSource().getBindingContext().getProperty("TechObjIsEquipOrFuncnlLoc");
				if (sTechnicalObjectType === "EAMS_EQUI") {
					this.openEquipment(oEvent);
				} else {
					this.openFunctionalLocation(oEvent);
				}
			},

			// before cleanup: SchedulingBoard.handleFuncLocLinkPress
			openFunctionalLocation: function (oEvent) {
				this._oFunctionalLocationPopupDelegate = new FunctionalLocationPopup();
				sap.ui.getCore().getMessageManager().registerObject(this._oFunctionalLocationPopupDelegate.getFragment(), true);
				this._oFunctionalLocationPopupDelegate.setContentToFragment(
					oEvent,
					this.oComponent,
					this.oComponent.getModel("readModel"),
					undefined,
					true
				);
			},

			// before cleanup: SchedulingBoard.handleEquipmentLinkPress
			openEquipment: function (oEvent) {
				this._oEquipmentPopupDelegate = new EquipmentPopup();
				sap.ui.getCore().getMessageManager().registerObject(this._oEquipmentPopupDelegate.getFragment(), true);
				this._oEquipmentPopupDelegate.setContentToFragment(
					oEvent,
					this.oComponent,
					this.oComponent.getModel("readModel"),
					undefined,
					true
				);
			},

			// before cleanup: SchedulingBoard.onMaintEventLinkPress
			openMaintEvent: function (oEvent) {
				var oSource = oEvent.getSource();
				var oContext = oSource.getBindingContext();
				var oOrderOp = oContext.getObject();
				this._oMaintEventPopupDelegate = new MaintenanceEventPopup();
				sap.ui.getCore().getMessageManager().registerObject(this._oMaintEventPopupDelegate.getFragment(), true);
				this._oMaintEventPopupDelegate.setContentToFragment(
					oOrderOp.MaintenanceRevision,
					oOrderOp.MaintenancePlanningPlant,
					oSource,
					this.getModel("readModel"),
					"/C_RSHPlngBucketAndEventDetails",
					0,
					0,
					"link",
					undefined
				);
			},

			openSchedules: function (oEvent) {
				var oLink = oEvent.getSource();
				var oOrderOp = oLink.getBindingContext().getObject();
				var bOpenSchedulesApp = oOrderOp.NumberOfMaintSchedSimulations === 0;
				if (bOpenSchedulesApp) {
					this._openSchedulesApp(oOrderOp.MaintSchedSimlnUUID);
				} else {
					this.controllers.ordergantt.openLinks._openSchedulesPopup(oEvent);
				}
			},

			_openSchedulesApp: function (sSimlnUUID) {
				var oTarget = {
					semanticObject: "WorkCenterUtilization",
					action: "operationsLeveling"
				};
				var oParams = {
					MaintSchedSimlnUUID: sSimlnUUID
				};
				var oAppStateInstance = AppState.getInstance();
				oAppStateInstance.checkIntentAndNavigate(oTarget, oParams, undefined);
			},

			// before cleanup: SchedulingBoard.handleScheduleListPress
			_openSchedulesPopup: function (oEvent) {
				this._oSchedulesPopupDelegate = new SchedulesPopup();
				sap.ui.getCore().getMessageManager().registerObject(this._oSchedulesPopupDelegate.getFragment(), true);
				this._oSchedulesPopupDelegate.setContentToFragment(oEvent, this.oComponent, this.oComponent.getModel("readModel"));
			}
		});
	}
);
