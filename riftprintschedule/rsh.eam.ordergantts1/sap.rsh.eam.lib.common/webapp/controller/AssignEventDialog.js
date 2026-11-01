/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/ui/core/mvc/Controller", "sap/ui/core/Fragment", "sap/rsh/eam/lib/common/utils/Constants", "sap/rsh/eam/lib/common/utils/utils"],
	function (Controller, Fragment, Constants, Utils) {
		"use strict";
		return Controller.extend("sap.rsh.eam.lib.common.controller.AssignEventDialog", {
			onOpen: function (oEvent, oView, oShape, iPageX, iPageY, oOrderContextMenuConfiguration, oOrderContextMenu) {
				return new Promise(
					function (resolve, reject) {
						this._fnResolve = resolve;
						this._onOpen(oEvent, oView, oShape, iPageX, iPageY, oOrderContextMenuConfiguration, oOrderContextMenu);
					}.bind(this)
				);
			},

			_onOpen: function (oEvent, oView, oShape, iPageX, iPageY, oOrderContextMenuConfiguration, oOrderContextMenu) {
				this.sOpenedPopover = null;
				this._oShape = oShape;
				this._iPageX = iPageX;
				this._iPageY = iPageY;
				this._oParentView = oView;
				this.sFragmentId = oView.getId();
				this.OrderContextMenu = oOrderContextMenu;
				this.iMinInputOffsetDuration = -10000;
				this.iMaxInputOffsetDuration = 10000;
				this._oOrderContextMenuConfiguration = oOrderContextMenuConfiguration;

				// Create a resource bundle for language specific texts
				var oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});
				var that = this;
				//var oPopoveSource = oEvent.getSource();
				this.createPopover("sap.rsh.eam.lib.common.view.AssignEventDialog").then(function (oPopover) {
					// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
					setTimeout(function () {
						var oPlaceHolder = new sap.m.Label();
						var oPopup = new sap.ui.core.Popup(oPlaceHolder, false, true, false);
						var eDock = sap.ui.core.Popup.Dock;
						// Assign the model object to the SAPUI5 core using the name "i18nLib"
						oPopover.setModel(oResourceModel, "i18nLib");
						// If running OPA5 test, then set Asset Model to the view
						if (Utils.isMockRun()) {
							oPopover.setModel(that._oParentView.getModel("assetModel"));
						}
						//Setting the offset to display  fragment next to the mouse cursor
						var sOffset = that._iPageX + 1 + " " + (that._iPageY - 15);
						oPopup.open(0, eDock.BeginTop, eDock.LeftTop, null, sOffset);
						oPopover.openBy(oPlaceHolder);
					}, 0);
				});
			},

			createPopover: function (fragmentName) {
				if (!this._oPopOver) {
					var that = this;

					return Fragment.load({
						id: that.sFragmentId,
						name: fragmentName,
						type: "XML",
						controller: that
					}).then(function (oPopover) {
						that._oPopOver = oPopover;
						that._oParentView.addDependent(that._oPopOver);
						return oPopover;
					});
				} else {
					// creates a new Promise that will be resolved with the given value as parameter
					return Promise.resolve(this._oPopOver);
				}
			},

			onAfterAssignDialogOpen: function () {
				//Binding entity "I_MaintenanceRevisionStdVH" to the smart field
				Fragment.byId(this.sFragmentId, "idSmartFieldMaintEvent").bindElement("/I_MaintenanceRevisionStdVH");
				this._oParentView.getModel().setRefreshAfterChange(true);
			},

			onPopoverClose: function (oEvent) {
				var oEventBus = sap.ui.getCore().getEventBus();
				if (!this.sOpenedPopover) {
					oEventBus.publish(Constants.sLibraryChannel, Constants.sOrderContextMenuClose, this._oShape);
				}
				this._oPopOver.destroy();
				this._oPopOver = null;
			},

			onAddMaintenanceEvent: function (oEvent) {
				this.sOpenedPopover = null;
				//read sMaintenance Event value
				var aMaintEventToken = Fragment.byId(this.sFragmentId, "idSmartFieldMaintEvent").getTokens();
				var oTokenValueSelected = aMaintEventToken[0].getCustomData()[0].getValue();
				var dRevisionStartDate = oTokenValueSelected.RevisionStartDate;
				var dRevisionEndDate = oTokenValueSelected.RevisionEndDate;
				var revisionStartDateTime = oTokenValueSelected.MaintRevisionStartDateTime;
				var revisionEndDateTime = oTokenValueSelected.MaintRevisionEndDateTime;
				var sMaintenanceEvent = oTokenValueSelected.MaintenanceRevision;

				var oEventBus = sap.ui.getCore().getEventBus();
				var oResult = {
					oShape: this._oShape,
					sMaintenanceEvent: sMaintenanceEvent,
					dRevisionStartDate: dRevisionStartDate,
					dRevisionEndDate: dRevisionEndDate,
					revisionStartDateTime: revisionStartDateTime,
					revisionEndDateTime: revisionEndDateTime,
					Action: Constants.Assign, // to be deleted later
				};
				oEventBus.publish(Constants.sLibraryChannel, Constants.sOpenAssignEventOrderCntxtMnuActn, oResult);
				this._fnResolve(oResult);
				this._oPopOver.close();
			},

			onCancel: function (oEvent) {
				this.sOpenedPopover = null;
				this._oPopOver.close();
			},

			/**
			 * Event handler for back navigation button
			 * Opens again the OrderContextMenu contect menu at same position
			 * Not a final close
			 * @param {object} oEvent - event data object
			 */
			onNavBackPress: function (oEvent) {
				this.sOpenedPopover = "ContextMenu";
				this._oPopOver.close();
				this.OrderContextMenu.onOpen(oEvent, this._oParentView, this._oOrderContextMenuConfiguration, this._oShape, this._iPageX, this._iPageY);
			},

			closePopover: function () {
				if (this._oPopOver && this._oPopOver.isOpen()) {
					this._oPopOver.close();
				}
			},

			onSelectMaintEvent: function (oEvent) {
				var aMaintEventToken = oEvent.getSource().getTokens();
				var oAssignEventButton = Fragment.byId(this.sFragmentId, "idAssignMaintEventOk");
				if (aMaintEventToken.length > 0) {
					oAssignEventButton.setEnabled(true);
				} else {
					oAssignEventButton.setEnabled(false);
				}
			}
		});
	}
);
