/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/gantt/simple/Relationship",
		"sap/rsh/eam/lib/common/menus/RelationshipActionSheet",
		"sap/rsh/eam/lib/common/menus/OrderContextMenu",
		"sap/gantt/misc/Utility"
	],
	function (BaseViewChildController, Constants, Utils, Relationship, RelationshipActionSheet, OrderContextMenu, GanttUtility) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.menu.ContextMenus.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this.controllers.navigation.isNavigationSupported("MaintenanceOrder", "change").then(
					function (bSupported) {
						var oOrderContextMenuConfigurationModel = this.oComponent.getModel("OrderContextMenuConfiguration");
						var bOpenOrder = bSupported || Utils.isMockRun();
						oOrderContextMenuConfigurationModel.setProperty("/OpenOrder", bOpenOrder);
					}.bind(this)
				);
			},

			onInitMembers: function () {
				this.oTreeTable = this.byId("idOrderTreeTable");
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
				this._oOrderContextMenu = undefined;
				this._oRelationshipActionSheet = undefined;
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

				if (!oShape) {
					return;
				} else {
					var sShapeId = oShape.getShapeUid();
					var oControl = this.oGanttChartWithTable.fullScreenMode() ? this.oGanttChartWithTable.getParent() : null;
					var aSelectedShapeIds = this.oGanttChartWithTable.getSelectedShapeUid();
					var bContextOpenForNonSelectedShape = !aSelectedShapeIds.includes(sShapeId);

					if (oShape instanceof Relationship) {
						var sPath = oShape.getBindingContext().getPath();
						var oData = oShape.getModel().getData(sPath);
						if (oData.RelationshipIsExplicit === "X") {
							this._openRelationshipContextMenu(oEvent, oShape, oControl);
						}
					} else if (oShape.getMetadata().getName() === "sap.gantt.simple.BaseGroup") {
						var oOrderAndOp = oShape.getBindingContext().getObject();
						var bOrder = oOrderAndOp.OrderOperationRowLevel === 0;
						var bOperation = oOrderAndOp.OrderOperationRowLevel === 1;
						if (bContextOpenForNonSelectedShape) {
							this.oGanttChartWithTable.deselectShapes(aSelectedShapeIds);
							this.oGanttChartWithTable.selectShapes([sShapeId]);
						}
						if (bOrder) {
							this._deSelectOperationsAndSuboperations();
							this._openOrderContextMenu(oEvent, oShape, oControl);
						} else if (bOperation) {
							this._deSelectOrders();
							this.controllers.ordergantt.operationActionSheet.open(oEvent);
						}
					}
				}
			},

			_deSelectShapes: function (iOrderOperationRowLevel) {
				var aSelectedShapeIds = this.oGanttChartWithTable.getSelectedShapeUid();
				var aDeselectShapesIds = aSelectedShapeIds.filter(function (id) {
					var oOperation = this.getModel().getData(GanttUtility.parseUid(id).shapeDataName);
					return oOperation && oOperation.OrderOperationRowLevel === iOrderOperationRowLevel;
				}, this);
				this.oGanttChartWithTable.deselectShapes(aDeselectShapesIds);
			},

			_deSelectOrders: function () {
				this._deSelectShapes(0);
			},

			_deSelectOperationsAndSuboperations: function () {
				this._deSelectShapes(1);
			},

			_openRelationshipContextMenu: function (oEvent, oShape, oControl) {
				var oView = this.getView();
				var iPageX = oEvent.getParameter("pageX");
				var iPageY = oEvent.getParameter("pageY");

				oShape.setSelected(true);

				if (!this._oRelationshipActionSheet) {
					this._oRelationshipActionSheet = new RelationshipActionSheet();
				}
				this._oRelationshipActionSheet.onOpen(oEvent, oView, oShape, iPageX, iPageY, oControl).then(this._onRelationshipAction.bind(this));

				this._deSelectOrders();
				this._deSelectOperationsAndSuboperations();
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
					this.controllers.ordergantt.assignEvent.onOrderContextMenuAssign(oResult);
				} else if (sAction === OrderContextMenu.actions.UnAssign) {
					this.controllers.ordergantt.assignEvent.onOrderContextMenuUnassign(oResult);
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
				if (this.oGanttChartWithTable.getSelectedShapeUid().length > 1) {
					_oOrderContextMenuConfiguration.setProperty("/TriggerScheduling", false);
				} else {
					_oOrderContextMenuConfiguration.setProperty("/TriggerScheduling", true);
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
