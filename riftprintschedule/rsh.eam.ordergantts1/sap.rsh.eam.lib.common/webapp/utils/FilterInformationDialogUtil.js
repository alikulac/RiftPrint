/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * FilterInformationDialogUtil is an utility class will help in displaying Information dialog,
 * when the filter applied on table from util charts, and handle the personalization settings for
 * "Do Not show again" property.
 * @author: SAP SE
 * @extends sap.ui.base.Object
 * @name sap.rsh.eam.lib.common.utils.FilterInformationDialogUtil
 */
sap.ui.define(
	[
		"sap/ui/base/Object",
		"sap/ui/model/json/JSONModel",
		"sap/rsh/eam/lib/common/utils/AppPersContainer",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/Constants"
	],
	function (oSAPObject, JSONModel, AppPersContainer, Utils, Constants) {
		"use strict";

		return oSAPObject.extend("sap.rsh.eam.lib.common.utils.FilterInformationDialogUtil", {
			/**
			 *
			 * @constructor
			 * @param {sap.ui.core.mvc.XMLView} oView the view object is initiated.
			 * @param {string} sFeature key value of personalization Parameter.
			 * @param {string} si18nKey i18n key referencing a property in the view's bundle - this is shown as the content of the popover
			 */
			constructor: function (oView, sFeature, si18nKey) {
				this._oView = oView;
				this._sFeature = sFeature;
				this._oDefaultJSON = {
					ShowDialog: true
				};

				// Default value that is shown in the message popover -
				this._sDialogueMessage = "FilterInfoDialogMsg";

				// However, if a specific key was passed in then we use that instead -
				if (si18nKey) {
					this._sDialogueMessage = si18nKey;
				}

				//this._oPMgr = PersonalizationManager.getPersonalizationManager();
			},
			/**
			 * @public
			 * This method will check for parameters in message to be displayed.
			 * @param {string} i18nparam value
			 * and then calls method to display popup.
			 */
			handleInfoDialogDynamicMsg: function (i18nparam) {
				if (i18nparam) {
					this._sDialogMsgParam = i18nparam;
				}
				this.handleInfoDialog();
			},
			/**
			 * @public
			 * This method will check for personalization value of given key(usually boolean),
			 * and decide to display the popup or not.
			 */
			handleInfoDialog: function () {
				setTimeout(
					function () {
						var oFilterDialogPersModel = AppPersContainer.getInstance().getFeatureModel(this._sFeature);
						// set default values if the model is empty
						if (Object.keys(oFilterDialogPersModel.getProperty("/")).length === 0) {
							if (oFilterDialogPersModel.bIsDataLoaded === true) {
								oFilterDialogPersModel.setProperty("/", this._oDefaultJSON);
								if (this._oDefaultJSON.ShowDialog) {
									this._openInfoDialog();
								}
							} else {
								oFilterDialogPersModel._pWhenDataLoaded.then(
									function () {
										if (Object.keys(oFilterDialogPersModel.getProperty("/")).length === 0) {
											oFilterDialogPersModel.setProperty("/", this._oDefaultJSON);
										} else {
											Utils.extendSimpleJSONCopy(oFilterDialogPersModel.getProperty("/"), this._oDefaultJSON);
										}
										if (this._oDefaultJSON.ShowDialog) {
											this._openInfoDialog();
										}
									}.bind(this)
								);
							}
						} else {
							//this._oDefaultJSON = oFilterDialogPersModel.getProperty("/");
							Utils.extendSimpleJSONCopy(oFilterDialogPersModel.getProperty("/"), this._oDefaultJSON);
							if (this._oDefaultJSON.ShowDialog) {
								this._openInfoDialog();
							}
						}
					}.bind(this),
					0
				);
			},
			/**
			 * This method will open the Information dialog.
			 * @private
			 */
			_openInfoDialog: function () {
				// Initialize the Information dialog.
				// Also set the local data dialogue text property, this allows the content inside the fragment to be controlled
				var oDialogueText = new JSONModel({
					DialogueText: this._oView.getController().getResourceBundle("i18n").getText(this._sDialogueMessage, this._sDialogMsgParam),
					bSwitchFromPersonalizationToVariantInfo:
						this._sFeature === Constants.sInfoToSwitchFromPersonalizationToVariant ||
						this._sFeature === Constants.sInfoToSwitchFromPersonalizationToVariantInAsset
				});
				if (!this._oInfoDialog) {
					var oResourceModel = new sap.ui.model.resource.ResourceModel({
						bundleName: "sap.rsh.eam.lib.common.messagebundle"
					});
					var sId = this._oView.createId("infoDialog--" + this._sFeature);
					this._oInfoDialog = sap.ui.xmlfragment(sId, "sap.rsh.eam.lib.common.view.FilterInformationDialog", this);
					// set the model for common library texts
					this._oInfoDialog.setModel(oResourceModel, "i18nLib");
					this._oInfoDialog.setModel(oDialogueText, "DialogueLocalData");
				} else {
					this._oInfoDialog.setModel(oDialogueText, "DialogueLocalData");
				}
				// add the view as dependent to view.
				if (this._oView.indexOfDependent(this._oInfoDialog) < 0) {
					this._oView.addDependent(this._oInfoDialog);
				}

				// As util charts triggering multiple events, do not open the dialog
				//if it is already opened.
				if (!this._oInfoDialog.isOpen()) {
					this._oInfoDialog.open();
				}
			},
			/**
			 * Event handler for closing the Information dialog.
			 * if the "Do not show again" check box selected persist the changes to p13n key.
			 */
			handleCloseButtonPress: function () {
				// Retrive the Check box from dialog.
				var oCB = this._oInfoDialog.getContent()[0].getContent()[1];
				if (oCB.getSelected()) {
					// persist the user preference to Fiori personalization.
					this._oDefaultJSON.ShowDialog = !oCB.getSelected();
					setTimeout(
						function () {
							AppPersContainer.getInstance().getFeatureModel(this._sFeature).setProperty("/", this._oDefaultJSON);
						}.bind(this),
						0
					);
				}
				//close the dialog.
				this._oInfoDialog.close();
			}
		});
	}
);
