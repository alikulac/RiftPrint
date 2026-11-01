/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/Fragment",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/controller/DateTimePopup",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/controller/AssignEventDialog",
		"sap/gantt/misc/Utility",
		"sap/ui/core/date/UI5Date"
	],
	function (Controller, Fragment, Constants, DateTimePopup, GanttUtils, Utils, AssignEventDialog, Utility, UI5Date) {
		"use strict";

		var oController;

		oController = Controller.extend("sap.rsh.eam.lib.common.controller.OrderContextMenu", {
			constructor: function (sOrderStartDateProperty) {
				this.sOrderStartDateProperty = sOrderStartDateProperty;
			},

			onOpen: function (oEvent, oView, oOrderContextMenuConfiguration, oShape, iPageX, iPageY, oControl) {
				return new Promise(
					function (resolve, reject) {
						this._fnResolve = resolve;
						this._onOpen(oEvent, oView, oOrderContextMenuConfiguration, oShape, iPageX, iPageY, oControl);
					}.bind(this)
				);
			},

			_onOpen: function (oEvent, oView, oOrderContextMenuConfiguration, oShape, iPageX, iPageY, oControl) {
				this.sOpenedPopover = null;
				this._oContextMenuEvent = oEvent;
				this._oShape = oShape;
				this._iPageX = iPageX;
				this._iPageY = iPageY;
				this._oParentView = oView;
				this._oParentControl = oControl;
				this.sFragmentId = oView.getId();
				this.oOrderContextMenuConfiguration = oOrderContextMenuConfiguration;

				if (!this._pPopover) {
					this._pPopover = Fragment.load({
						id: this.sFragmentId,
						name: "sap.rsh.eam.lib.common.view.OrderContextMenu",
						controller: this
					}).then(function (oPopover) {
						oView.addDependent(oPopover);
						return oPopover;
					});
				}
				// Create a resource bundle for language specific texts
				var oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});
				var that = this;
				this._pPopover.then(function (oPopover) {
					that.oPopover = oPopover;
					// Assign the model object to the SAPUI5 core using the name "i18nLib"
					oPopover.setModel(oResourceModel, "i18nLib");
					oPopover.setModel(oOrderContextMenuConfiguration, "OrderContextMenuConfiguration");
					//Placeholder to display the order context menu next to the mouse cursor
					var oPlaceHolder = new sap.m.Label();
					var oPopup = new sap.ui.core.Popup(oPlaceHolder, false, true, false);
					var eDock = sap.ui.core.Popup.Dock;
					//Setting the offset to display the order context menu next to the mouse cursor
					var sOffset = that._iPageX + 1 + " " + (that._iPageY - 15);
					oPopup.open(0, eDock.BeginTop, eDock.LeftTop, oControl, sOffset);
					oPopover.openBy(oPlaceHolder);
				});
			},

			onPopoverClose: function (oEvent) {
				var oEventBus = sap.ui.getCore().getEventBus();
				if (!this.sOpenedPopover) {
					oEventBus.publish(Constants.sLibraryChannel, Constants.sOrderContextMenuClose, this._oShape);
				}
			},

			onCollapsePress: function (oEvent) {
				this.sOpenedPopover = null;
				this.oPopover.close();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sCollapseOrderCntxtMnuActn, this._oShape);
				this._fnResolve({ shape: this._oShape, action: oController.actions.Collapse });
			},

			onExpandPress: function (oEvent) {
				this.sOpenedPopover = null;
				this.oPopover.close();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sExpandOrderCntxtMnuActn, this._oShape);
				this._fnResolve({ shape: this._oShape, action: oController.actions.Expand });
			},

			onTriggerSchedulingPress: function (oEvent) {
				this.sOpenedPopover = null;
				this.oPopover.close();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sTriggerSchedulingForOrderCntxtMnuActn, this._oShape);
				this._fnResolve({ shape: this._oShape, action: oController.actions.Schedule });
			},

			onOpenGanttPress: function (oEvent) {
				this.sOpenedPopover = null;
				this.oPopover.close();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sOpenGanttBoardOrderCntxtMnuActn, this._oShape);
				this._fnResolve({ shape: this._oShape, action: oController.actions.OpenGantt });
			},

			onPressAssignEvent: function (oEvent) {
				this.sOpenedPopover = "AssignEvent";
				if (!this.AssignEventDialog) {
					this.AssignEventDialog = new AssignEventDialog();
				}
				this.AssignEventDialog.onOpen(
					oEvent,
					this._oParentView,
					this._oShape,
					this._iPageX,
					this._iPageY,
					this.oOrderContextMenuConfiguration,
					this
				).then(
					function (oResult) {
						oResult.action = oController.actions.Assign;
						this._fnResolve(oResult);
					}.bind(this)
				);
			},

			onPressUnAssignEvent: function (oEvent) {
				this.sOpenedPopover = null;
				var oEventBus = sap.ui.getCore().getEventBus();
				var oResult = {
					oShape: this._oShape,
					sMaintenanceEvent: "",
					Action: Constants.UnAssign, // to be deleted later
					action: oController.actions.UnAssign
				};
				oEventBus.publish(Constants.sLibraryChannel, Constants.sUnAssignMaintEventAction, oResult);
				this._fnResolve(oResult);
				this.oPopover.close();
			},

			onOpenOrderPress: function (oEvent) {
				this.sOpenedPopover = null;
				this.oPopover.close();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sOpenOrderCntxtMnuActn, this._oShape);
				this._fnResolve({ shape: this._oShape, action: oController.actions.OpenOrder });
			},

			closePopover: function () {
				if (this.oPopover && this.oPopover.isOpen()) {
					this.oPopover.close();
				} else if (this.sOpenedPopover === "AssignEvent") {
					this.AssignEventDialog.closePopover();
				}
			},
			getOpenedPopover: function () {
				return this.sOpenedPopover;
			},

			onSetPlannedStartPress: function (oEvent) {
				//planned start popover has no back nav logic and should work independent from context menu
				this.sOpenedPopover = null;
				this.oPopover.close();
				//Close the current popover and open a new one at the exact same place
				if (!this.DateTimePopup) {
					this.DateTimePopup = new DateTimePopup();
				}

				var sPath = Utility.parseUid(this._oShape.getShapeUid()).shapeDataName;
				var oShape = this._oShape.getModel().getData(sPath);
				if (!oShape.hasOwnProperty(this.sOrderStartDateProperty)) {
					throw Error("Shape does not contain start date property " + this.sOrderStartDateProperty);
				}
				var dDefaultDate = oShape[this.sOrderStartDateProperty];
				var sCalledFrom = "Order";

				var dMinDate;
				if (Utils.isMockRun()) {
					// If running OPA5 test, do not disable past dates, because mock data dates are in past and test fails, need to run the test without disabling past dates
					dMinDate = undefined;
				} else {
					// disable past dates
					dMinDate = UI5Date.getInstance();
				}
				this.DateTimePopup.onOpen(oEvent, this._oParentView, this._oShape, this._iPageX, this._iPageY, sCalledFrom, dDefaultDate, dMinDate).then(
					function (oResult) {
						oResult.action = oController.actions.SetPlannedStart;
						this._fnResolve(oResult);
					}.bind(this)
				);
			}
		});

		oController.actions = {
			Expand: "Expand",
			Collapse: "Collapse",
			Schedule: "Schedule",
			OpenGantt: "OpenGantt",
			OpenOrder: "OpenOrder",
			Assign: "Assign",
			UnAssign: "UnAssign",
			SetPlannedStart: "SetPlannedStart"
		};

		return oController;
	}
);
