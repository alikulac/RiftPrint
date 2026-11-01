/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/Fragment",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/controller/EditRelationshipOffset"
	],
	function (Controller, Fragment, Constants, EditRelationshipOffset, sModel) {
		"use strict";

		var oController;

		oController = Controller.extend("sap.rsh.eam.lib.common.controller.RelationshipActionSheet", {
			onOpen: function (oEvent, oView, oShape, iPageX, iPageY, oControl, sModel) {
				return new Promise(
					function (resolve, reject) {
						this._fnResolve = resolve;
						this._onOpen(oEvent, oView, oShape, iPageX, iPageY, oControl, sModel);
					}.bind(this)
				);
			},

			_onOpen: function (oEvent, oView, oShape, iPageX, iPageY, oControl) {
				this.sOpenedPopover = null;
				this._oShape = oShape;
				this._iPageX = iPageX;
				this._iPageY = iPageY;
				this._oParentView = oView;
				this.sFragmentId = oView.getId();
				this._sModel = sModel;

				if (!this._pPopover) {
					this._pPopover = Fragment.load({
						id: this.sFragmentId,
						name: "sap.rsh.eam.lib.common.view.RelationshipActionSheet",
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
				var oRelShapeDetails = oShape.getBindingContext().getObject();
				this.oRelOffset = {};
				this.oRelOffset.sRelOffsetDuration = oRelShapeDetails.OpRelshpOffsetDuration;
				this.oRelOffset.sRelOffsetUnit = oRelShapeDetails.OpRelshpOffsetDurationUnit;
				this._pPopover.then(function (oPopover) {
					that.oPopover = oPopover;
					// Assign the model object to the SAPUI5 core using the name "i18n"
					oPopover.setModel(oResourceModel, "i18nLib");
					//Placeholder to display the delete relationship actionsheet next to the mouse cursor
					var oPlaceHolder = new sap.m.Label();
					var oPopup = new sap.ui.core.Popup(oPlaceHolder, false, true, false);
					var eDock = sap.ui.core.Popup.Dock;
					//Setting the offset to display the delete relationship fragment next to the mouse cursor
					var sOffset = that._iPageX + 1 + " " + (that._iPageY - 15);
					oPopup.open(0, eDock.BeginTop, eDock.LeftTop, oControl, sOffset);
					that._setRelationshipOffsetVisibility(oView);
					oPopover.openBy(oPlaceHolder);
				});
			},

			onPopoverClose: function (oEvent) {
				var oEventBus = sap.ui.getCore().getEventBus();
				if (!this.sOpenedPopover) {
					oEventBus.publish(Constants.sLibraryChannel, Constants.sFinalRelationshipOffsetClose, this._oShape);
				}
				oEventBus.publish(Constants.sLibraryChannel, Constants.sRelationshipDeleteContextMenuClose, this._oShape);
			},

			onDelete: function (oEvent) {
				this.sOpenedPopover = null;
				this.oPopover.close();
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sRelationshipDeleteInGantt, this._oShape);
				this._fnResolve({ action: oController.actions.Delete, shape: this._oShape });
			},

			onEditOffsetPress: function (oEvent) {
				this.sOpenedPopover = "EditOffset";
				this.oPopover.close();
				//Close the current popover and open a new one at the exact same place
				if (!this.EditRelationshipOffset) {
					this.EditRelationshipOffset = new EditRelationshipOffset();
				}
				this.EditRelationshipOffset.onOpen(
					oEvent,
					this._oParentView,
					this._oShape,
					this._iPageX,
					this._iPageY,
					this,
					this.oRelOffset,
					this._sModel
				).then(
					function (oResult) {
						oResult.action = oController.actions.SaveOffset;
						this._fnResolve(oResult);
					}.bind(this)
				);
			},

			onDeleteOffsetPress: function (oEvent) {
				var oEventData = {
					action: oController.actions.DeleteOffset,
					shape: this._oShape,
					OpRelshpOffsetDuration: "0.0",
					OpRelshpOffsetDurationUnit: ""
				};
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sRelationshipOffsetDelete, oEventData);
				this._fnResolve(oEventData);
				this.sOpenedPopover = null;
				this.oPopover.close();
			},

			_setRelationshipOffsetVisibility: function (oView) {
				oView.byId("idAddOffsetbtn").setVisible(this.getOffsetBtnVisible(Constants.sAddOffsetBtn));
				oView.byId("idEditOffsetbtn").setVisible(this.getOffsetBtnVisible(Constants.sEditOffsetBtn));
				oView.byId("idDeleteOffsetbtn").setVisible(this.getOffsetBtnVisible(Constants.sDeleteOffsetBtn));
			},

			getOffsetBtnVisible: function (sBtn) {
				if (this.oRelOffset.sRelOffsetDuration === "0.0") {
					if (sBtn === Constants.sAddOffsetBtn) {
						return true;
					}
				} else {
					if (sBtn !== Constants.sAddOffsetBtn) {
						return true;
					}
				}
				return false;
			},

			/**
			 * returns true if Relationship Actionsheet is open else returns false
			 * @returns {Boolean} [bIsPopoverOpen] Boolean value true or false
			 */
			isPopoverOpen: function () {
				var bIsPopoverOpen = false;
				if ((this.oPopover && this.oPopover.isOpen()) || this.sOpenedPopover === "EditOffset") {
					bIsPopoverOpen = true;
				}
				return bIsPopoverOpen;
			},

			/**
			 * calling this function closes RelationshipActionSheet and its dependent popup
			 */
			closePopover: function () {
				if (this.oPopover && this.oPopover.isOpen()) {
					this.oPopover.close();
				} else if (this.sOpenedPopover === "EditOffset") {
					this.EditRelationshipOffset.closePopover();
				}
			}
		});

		oController.actions = {
			Delete: "Delete",
			SaveOffset: "SaveOffset",
			DeleteOffset: "DeleteOffset"
		};

		return oController;
	}
);
