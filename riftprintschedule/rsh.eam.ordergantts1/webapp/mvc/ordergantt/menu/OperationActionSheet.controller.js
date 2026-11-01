/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseFragment.controller", "sap/rsh/eam/lib/common/utils/Constants", "sap/rsh/eam/lib/common/utils/utils"],
	function (BaseFragmentController, Constants, Utils) {
		"use strict";

		return BaseFragmentController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.menu.OperationActionSheet.controller", {
			constructor: function (oComponent, oView, oGanttChart) {
				BaseFragmentController.call(this, {
					component: oComponent,
					dependent: oView,
					fragmentName: "zrsh.eam.ordergantts1.mvc.ordergantt.menu.OperationActionSheet",
					fragmentId: oView.getId(),
					ganttChart: oGanttChart
				});
			},

			onInitMembers: function (oParams) {
				this._oGanttChartWithTable = oParams.ganttChart;
				this._oShape = undefined;
				this._bActionFromMenu = false;
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
				var iPageX = oEvent.getParameter("pageX");
				var iPageY = oEvent.getParameter("pageY");
				var oControl = this._oGanttChartWithTable.fullScreenMode() ? this._oGanttChartWithTable.getParent() : null;
				var oOrdersAndOps = this._oShape.getBindingContext().getObject();

				var bInProcess = oOrdersAndOps.ProcessingStatus === Constants.inProcessCode;
				if (bInProcess) {
					var sMessage = this.oBundle.getText("InfoMessageOperationInProcessStatus");
					Utils.addMessage(sMessage, sap.ui.core.MessageType.Information, Constants.sDisplayTypeMessageToast);
				} else {
					this.getFragment().then(
						function () {
							this._setVisibilities(
								oOrdersAndOps.ProcessingStatus,
								oOrdersAndOps.OpBscStartDateConstraintType,
								oOrdersAndOps.NumberOfAssignedPersons
							);
							this._open(iPageX, iPageY, oControl);
						}.bind(this)
					);
				}
			},

			// before cleanup: _openOperationShapeContextMenu
			_open: function (iPageX, iPageY, oControl) {
				//Placeholder to display the operatoin actionsheet next to the mouse cursor
				var oPlaceHolder = new sap.m.Label();
				var oPopup = new sap.ui.core.Popup(oPlaceHolder, false, true, false);
				var eDock = sap.ui.core.Popup.Dock;
				//Setting the offset to display the operation context menu fragment next to the mouse cursor
				var sOffset = iPageX + 1 + " " + (iPageY - 15);
				oPopup.open(0, eDock.BeginTop, eDock.LeftTop, oControl, sOffset);
				this._oFragment.openBy(oPlaceHolder);
			},

			// before cleanup: _setupOperationShapeContextMenu
			_setVisibilities: function (iOpProcessingStatus, sOpBscStartDateConstraintType, sNumberOfAssignedPersons) {
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
				this.controllers.orderGantt.assignPeople(aShapePaths);
			},

			onUnassignButton: function (oEvent) {
				this._bActionFromMenu = true;
				var aShapePaths = this._getShapePaths(this._oShape);
				this.controllers.orderGantt.unassignPeople(aShapePaths);
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
						var sOpShapePath = sap.gantt.misc.Utility.parseUid(aSelectedShapeUid[i]).shapeDataName;
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
