/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/gantt/simple/Relationship",
		"sap/rsh/eam/lib/common/controller/RelationshipActionSheet",
		"sap/rsh/eam/lib/common/controller/OrderContextMenu"
	],
	function (BaseViewChildController, Constants, Utils, Relationship, RelationshipActionSheet, OrderContextMenu) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.menu.ContextMenus.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this.oCrossAppNav
					.isNavigationSupported([
						{
							semanticObject: "MaintenanceOrder",
							action: "change"
						}
					])
					.done(
						function (oData) {
							var oOrderContextMenuConfigurationModel = this.oComponent.getModel("OrderContextMenuConfiguration");
							var bOpenOrder = oData[0].supported || Utils.isMockRun();
							oOrderContextMenuConfigurationModel.setProperty("/OpenOrder", bOpenOrder);
						}.bind(this)
					);
			},

			onInitMembers: function () {
				this.oTreeTable = this.byId("idOrderTreeTable");
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
				this._oOrderContextMenu = undefined;
				this._oRelationshipActionSheet = undefined;
				this.oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			},

			// before cleanup: closeContextMenus
			close: function () {
				if (this._oRelationshipActionSheet && this._oRelationshipActionSheet.isPopoverOpen()) {
					this._oRelationshipActionSheet.closePopover();
				}
				if (this._oOrderContextMenu) {
					this._oOrderContextMenu.closePopover();
				}
				this.controllers.ordergantt.operationActionSheet.close();
			},

			// before cleanup: onShapeContextMenu
			open: function (oEvent) {
				var oShape = oEvent.getParameter("shape");
				var oControl = this.oGanttChartWithTable.fullScreenMode() ? this.oGanttChartWithTable.getParent() : null;

				if (!oShape) {
					return;
				} else if (oShape instanceof Relationship) {
					var sPath = oShape.getBindingContext().getPath();
					var oData = oShape.getModel().getData(sPath);
					if (oData.RelationshipIsExplicit === "X") {
						this._openRelationshipContextMenu(oEvent, oShape, oControl);
					}
				} else if (oShape.getMetadata().getName() === "sap.gantt.simple.BaseGroup") {
					var oOrdersAndOps = oShape.getBindingContext().getObject();
					var bOrder = oOrdersAndOps.OrderOperationRowLevel === 0;
					var bOperation = oOrdersAndOps.OrderOperationRowLevel === 1;
					if (bOrder) {
						this._openOrderContextMenu(oEvent, oShape, oControl);
					} else if (bOperation) {
						this.controllers.ordergantt.operationActionSheet.open(oEvent);
					}
				}
			},

			_openRelationshipContextMenu: function (oEvent, oShape, oControl) {
				var oView = this.getView();
				var iPageX = oEvent.getParameter("pageX");
				var iPageY = oEvent.getParameter("pageY");

				// Relationship color gets changed to red on right mouse click. To avoid this, setting the color of relationship to Informative
				oShape.setProperty("selectedStroke", "@sapUiInformative", true);
				//use setProprty to change stroke as it avoids rerender of gantt on right click of relationship.
				//whereas using setSelectedStroke("@sapUiInformative") will cause rerender and trigger visibleHorizonUpdate in case of multiple gantts

				if (!this._oRelationshipActionSheet) {
					this._oRelationshipActionSheet = new RelationshipActionSheet();
				}
				this._oRelationshipActionSheet.onOpen(oEvent, oView, oShape, iPageX, iPageY, oControl).then(this._onRelationshipAction.bind(this));
				if (!oShape.getSelected()) {
					this.oGanttChartWithTable.deselectShapes(this.oGanttChartWithTable.getSelectedShapeUid());
				}
			},

			_onRelationshipAction: function (oResult) {
				var sAction = oResult.action;
				if (sAction === RelationshipActionSheet.actions.Delete) {
					this.controllers.ordergantt.editRelationships.delete(oResult.shape);
				} else if (sAction === RelationshipActionSheet.actions.SaveOffset) {
					this.controllers.ordergantt.editRelationships.saveOffset(oResult);
				} else if (sAction === RelationshipActionSheet.actions.DeleteOffset) {
					this.controllers.ordergantt.editRelationships.deleteOffset(oResult);
				} else {
					throw new Error("unhandled action " + sAction);
				}
			},

			_openOrderContextMenu: function (oEvent, oShape, oControl) {
				this._setMenuConfiguration(oShape);
				this._setMenuConfigurationTriggerScheduling(oShape);
				this._setMenuConfigurationAssignEvent(oShape);
				this._setMenuConfigurationSetPlannedStart(oShape);

				if (!this._oOrderContextMenu) {
					this._oOrderContextMenu = new OrderContextMenu("OrderStartDateTime");
				}

				var oView = this.getView();
				var iPageX = oEvent.getParameter("pageX");
				var iPageY = oEvent.getParameter("pageY");
				var oOrderContextMenuConfiguration = this.getModel("OrderContextMenuConfiguration");
				this._oOrderContextMenu
					.onOpen(oEvent, oView, oOrderContextMenuConfiguration, oShape, iPageX, iPageY, oControl)
					.then(this._onOrderAction.bind(this));
			},

			_onOrderAction: function (oResult) {
				var sAction = oResult.action;
				if (sAction === OrderContextMenu.actions.Expand) {
					this.controllers.ordergantt.expandOrders.expandOrderByShape(oResult.shape);
				} else if (sAction === OrderContextMenu.actions.Collapse) {
					this.controllers.ordergantt.expandOrders.collapseOrderByShape(oResult.shape);
				} else if (sAction === OrderContextMenu.actions.Assign) {
					this.controllers.ordergantt.assignEvent.onOrderContextMenuAssignEventAction(oResult);
				} else if (sAction === OrderContextMenu.actions.UnAssign) {
					this.controllers.ordergantt.assignEvent.onOrderContextMenuAssignEventAction(oResult);
				} else if (sAction === OrderContextMenu.actions.Schedule) {
					this.controllers.ordergantt.scheduleOrders.schedule(oResult.shape);
				} else if (sAction === OrderContextMenu.actions.OpenOrder) {
					this.controllers.ordergantt.openOrders.onOpenOrderByContextMenu(oResult.shape);
				} else if (sAction === OrderContextMenu.actions.SetPlannedStart) {
					this.controllers.ordergantt.updateOrderOpDates.onSetPlannedDate(oResult);
				} else {
					throw new Error("unhandled action " + sAction);
				}
			},

			_setMenuConfiguration: function (oShape) {
				//Update Order Context Menu Configuration expand/collapse setting based on current row expansion
				var _oOrderContextMenuConfiguration = this.getModel("OrderContextMenuConfiguration");
				var iIndexOfOrderContextMenuRow = oShape.getParentRowSettings().getParentRow().getIndex();
				if (this.oTreeTable.isExpanded(iIndexOfOrderContextMenuRow)) {
					_oOrderContextMenuConfiguration.setProperty("/Expand", false);
					_oOrderContextMenuConfiguration.setProperty("/Collapse", true);
				} else {
					_oOrderContextMenuConfiguration.setProperty("/Expand", true);
					_oOrderContextMenuConfiguration.setProperty("/Collapse", false);
				}
			},

			_setMenuConfigurationTriggerScheduling: function (oShape) {
				var _oOrderContextMenuConfiguration = this.getModel("OrderContextMenuConfiguration");
				//Check if the Shape is selected or not
				if (oShape.getSelected()) {
					//Update Order Context Menu Configuration TriggerSchedulingEnabled setting to false for multi order shape selection case
					if (this.oGanttChartWithTable.getSelectedShapeUid().length > 1) {
						var aSelectedShapeUid = this.oGanttChartWithTable.getSelectedShapeUid();
						var oDataModel = this.getModel();
						var sOpShapePath;
						var iSelectedOrdersCount = 0;
						for (var i = 0; i < aSelectedShapeUid.length; i++) {
							sOpShapePath = sap.gantt.misc.Utility.parseUid(aSelectedShapeUid[i]).shapeDataName;
							if (oDataModel.getData(sOpShapePath).OrderOperationRowLevel === 0) {
								iSelectedOrdersCount++;
							}
						}
						if (iSelectedOrdersCount > 1) {
							_oOrderContextMenuConfiguration.setProperty("/TriggerScheduling", false);
						} else {
							_oOrderContextMenuConfiguration.setProperty("/TriggerScheduling", true);
						}
					}
				} else {
					//Deselect the shapes which are selected along with right clicked
					_oOrderContextMenuConfiguration.setProperty("/TriggerScheduling", true);
					this.oGanttChartWithTable.deselectShapes(this.oGanttChartWithTable.getSelectedShapeUid());
				}
			},

			_setMenuConfigurationAssignEvent: function (oShape) {
				//Update Order Context menu Configuration "Assign"/"Unassign" setting to true/false based on the MaintenanceEvent value of the selected shape
				var _oOrderContextMenuConfiguration = this.getModel("OrderContextMenuConfiguration");
				var sOrderSPath = oShape.getParentRowSettings().getParentRow().getBindingContext().getPath();
				var oOrderData = this.oModel.getData(sOrderSPath);
				var sMaintRevisionKey = oOrderData.MaintenanceRevision;
				var iProcessingStatus = oOrderData.ProcessingStatus;
				if (iProcessingStatus === Constants.inProcessCode) {
					_oOrderContextMenuConfiguration.setProperty("/UnAssignEvent", false);
					_oOrderContextMenuConfiguration.setProperty("/AssignEvent", false);
				} else if (sMaintRevisionKey !== "") {
					_oOrderContextMenuConfiguration.setProperty("/UnAssignEvent", true);
					_oOrderContextMenuConfiguration.setProperty("/AssignEvent", true);
				} else {
					_oOrderContextMenuConfiguration.setProperty("/UnAssignEvent", false);
					_oOrderContextMenuConfiguration.setProperty("/AssignEvent", true);
				}
			},

			_setMenuConfigurationSetPlannedStart: function (oShape) {
				var _oOrderContextMenuConfiguration = this.getModel("OrderContextMenuConfiguration");
				var bInProcessOrder = oShape.getBindingContext().getObject().ProcessingStatus === Constants.inProcessCode;
				_oOrderContextMenuConfiguration.setProperty("/SetPlannedStart", !bInProcessOrder);
			}
		});
	}
);
