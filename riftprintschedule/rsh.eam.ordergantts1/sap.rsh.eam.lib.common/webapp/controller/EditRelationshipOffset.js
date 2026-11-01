/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/Fragment",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/formatters/formatter",
		"sap/ui/model/json/JSONModel"
	],
	function (Controller, Fragment, Constants, Formatter, JSONModel) {
		"use strict";
		return Controller.extend("sap.rsh.eam.lib.common.controller.EditRelationshipOffset", {
			formatter: Formatter,

			onOpen: function (oEvent, oView, oShape, iPageX, iPageY, oRelationshipActionSheet, oRelOffset, sModel) {
				return new Promise(
					function (resolve, reject) {
						this._fnResolve = resolve;
						this._onOpen(oEvent, oView, oShape, iPageX, iPageY, oRelationshipActionSheet, oRelOffset, sModel);
					}.bind(this)
				);
			},

			_onOpen: function (oEvent, oView, oShape, iPageX, iPageY, oRelationshipActionSheet, oRelOffset, sModel) {
				this.sOpenedPopover = null;
				this._oShape = oShape;
				this._iPageX = iPageX;
				this._iPageY = iPageY;
				this._oParentView = oView;
				this.sFragmentId = oView.getId();
				this.RelationshipActionSheet = oRelationshipActionSheet;
				this.oRelOffset = oRelOffset;
				this.iMinInputOffsetDuration = -10000;
				this.iMaxInputOffsetDuration = 10000;
				this._oEditRelationshipOffset = new JSONModel({ sUnitOfMeasure: "H" });

				if (!this._pPopover) {
					this._pPopover = Fragment.load({
						id: this.sFragmentId,
						name: "sap.rsh.eam.lib.common.view.EditRelationshipOffset",
						controller: this
					}).then(function (oPopover) {
						oView.addDependent(oPopover);
						return oPopover;
					});
				}

				// Create a resource bundle for language specific texts
				this.oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});
				var that = this;
				this._pPopover.then(function (oPopover) {
					that.oPopover = oPopover;
					oPopover.setModel(that.oResourceModel, "i18nLib");
					oPopover.setModel(that._oEditRelationshipOffset, "EditRelationshipOffset");
					var oDataModel = oView.getModel(sModel);
					oPopover.setModel(oDataModel, "data");
					//Placeholder to display the popover next to the mouse cursor
					var oPlaceHolder = new sap.m.Label();
					var oPopup = new sap.ui.core.Popup(oPlaceHolder, false, true, false);
					var eDock = sap.ui.core.Popup.Dock;
					//Setting the offset to display  fragment next to the mouse cursor
					var sOffset = that._iPageX + 1 + " " + (that._iPageY - 15);
					oPopup.open(0, eDock.BeginTop, eDock.LeftTop, null, sOffset);
					that._setRelatioshipOffsetEditMenu(oView);
					oPopover.openBy(oPlaceHolder);
				});
			},

			/*
			 * sets up EditRelationshipOffset popup input and unit elements
			 * @private
			 * @param {Object} [oView] Parent View Object
			 */
			_setRelatioshipOffsetEditMenu: function (oView) {
				// TO DO change placeholder behavior and remove the formatting not really needed for number format
				var oInputOffset = oView.byId("idOffsetInput"),
					sInputOffsetValue,
					sInputOffsetPlaceholder;
				if (this.oRelOffset.sRelOffsetDuration === "0.0") {
					sInputOffsetPlaceholder = this.formatter.formatDuration(this.oRelOffset.sRelOffsetDuration);
					sInputOffsetValue = "";
				} else {
					sInputOffsetValue = this.formatter.formatDuration(this.oRelOffset.sRelOffsetDuration);
					sInputOffsetPlaceholder = "";
				}
				oInputOffset.setPlaceholder(sInputOffsetPlaceholder);
				oInputOffset.setValue(sInputOffsetValue);
				oInputOffset.setValueState("None");
				if (this.oRelOffset.sRelOffsetUnit) {
					this._oEditRelationshipOffset.setProperty("/sUnitOfMeasure", this.oRelOffset.sRelOffsetUnit);
				} else {
					this.oRelOffset.sRelOffsetUnit = "H";
				}
				oView.byId("idOkBtn").setEnabled(false);
			},

			onPopoverClose: function (oEvent) {
				var oEventBus = sap.ui.getCore().getEventBus();
				if (!this.sOpenedPopover) {
					oEventBus.publish(Constants.sLibraryChannel, Constants.sFinalRelationshipOffsetClose, this._oShape);
				}
				oEventBus.publish(Constants.sLibraryChannel, Constants.sEditRelationshipOffsetClose, this._oShape);
			},

			onCancel: function (oEvent) {
				this.sOpenedPopover = null;
				this.oPopover.close();
			},

			/**
			 * Event handler for back navigation button
			 * Opens again the RelationshipActionSheet contect menu at same position
			 * Not a final close
			 * @param {object} oEvent - event data object
			 */
			onNavBackPress: function (oEvent) {
				this.sOpenedPopover = "ContextMenu";
				this.oPopover.close();
				this.RelationshipActionSheet.onOpen(oEvent, this._oParentView, this._oShape, this._iPageX, this._iPageY);
			},

			onSubmit: function (oEvent) {
				var oInputOffset = this._oParentView.byId("idOffsetInput"),
					oInputUnit = this._oParentView.byId("idOffsetUnit"),
					oEventData = {
						shape: this._oShape,
						OpRelshpOffsetDuration: this.formatter.parseLocaleNumber(oInputOffset.getValue()).toString(),
						OpRelshpOffsetDurationUnit: oInputUnit.getSelectedKey()
					};
				var oEventBus = sap.ui.getCore().getEventBus();
				oEventBus.publish(Constants.sLibraryChannel, Constants.sRelationshipOffsetSubmit, oEventData);
				this._fnResolve(oEventData);
				this.sOpenedPopover = null;
				this.oPopover.close();
			},

			/**
			 * Event handler for liveChange event of Input fields for offset.
			 * Validates the input and sets button enablement based on this
			 * @param {object} oEvent - event data object
			 */
			onOffsetChange: function (oEvent) {
				var oInputOffset = this._oParentView.byId("idOffsetInput"),
					oInputUnit = this._oParentView.byId("idOffsetUnit"),
					oOKBtn = this._oParentView.byId("idOkBtn"),
					sOffsetDuration = oEvent.getParameter("newValue"),
					sOffsetUnit = oInputUnit.getSelectedKey();

				oInputOffset.setValueState("None");
				oInputOffset.setValueStateText("");
				oOKBtn.setEnabled(false);

				var iOffsetDuration = this.formatter.parseLocaleNumber(sOffsetDuration);

				//OK button stays disabled when duration is empty or values are the same as bevor and function can be left
				if (
					sOffsetDuration === "" ||
					(iOffsetDuration === parseFloat(this.oRelOffset.sRelOffsetDuration) && sOffsetUnit === this.oRelOffset.sRelOffsetUnit)
				) {
					return;
				}
				if (!iOffsetDuration || iOffsetDuration <= this.iMinInputOffsetDuration || iOffsetDuration >= this.iMaxInputOffsetDuration) {
					oInputOffset.setValueStateText(this.oResourceModel.getResourceBundle().getText("ErrorMessageOffsetNumberValidation"));
					oInputOffset.setValueState("Error");
				} else {
					oOKBtn.setEnabled(true);
				}
			},

			/**
			 * calling this function closes EditRelationshipOffset popup
			 */
			closePopover: function () {
				if (this.oPopover && this.oPopover.isOpen()) {
					this.oPopover.close();
				}
			}
		});
	}
);
