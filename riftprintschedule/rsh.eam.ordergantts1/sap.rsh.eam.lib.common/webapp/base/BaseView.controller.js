/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Base controller for all the controllers in the application
 * Provide the services like accesing the router across the component
 * can be added any additional methods which can be re-used across the component.
 * @author: SAP SE
 * @extends sap.ui.core.mvc.Controller
 * @name sap.rsh.eam.lib.common.controller.BaseController
 */
sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/MessageHandler",
		"sap/ui/model/json/JSONModel"
	],
	function (Controller, History, Constants, MessageHandler, JSONModel) {
		"use strict";
		return Controller.extend("sap.rsh.eam.lib.common.base.BaseView.controller", {
			_oMainMessagePopover: null,

			onInit: function () {
				this.oComponent = this.getOwnerComponent();
				this._oOwnerComponent = this.getOwnerComponent(); // legacy
				this.oModel = this.oComponent.getModel();
				this.oBundle = this.oComponent.getModel("i18n").getResourceBundle();
				this.oCommonBundle = this.oComponent.getModel("i18nLib").getResourceBundle();
				this.controllers = this.oComponent.controllers;
				var oUIModel = this.oComponent.getModel("UIModel");
				if (oUIModel) {
					this.oUIModel = oUIModel;
				}
				this.onInitMembers();
			},

			onInitMembers: function () {
			},

			/**
			 * Convenience method for accessing the router.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter: function () {
				return sap.ui.core.UIComponent.getRouterFor(this);
			},

			onExit: function () {
				if (this._oMessageHandler) {
					this._oMessageHandler.destroy();
				}
				/*Incident 2180370966 fix: Don't destroy event bus as in addition to our application ushell, 
            and others maybe using this. Need to properly unsubscribe each event
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.destroy();*/
			},

			/**
			 * Convenience method for getting the view model by name.
			 * @public
			 * @param {string} [sName] the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel: function (sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel: function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/**
			 * Getter for the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle: function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			_getI18nText: function (sKey, aParams) {
				if (!this._oResourceBundle) {
					this._oResourceBundle = this.getResourceBundle();
				}
				return this._oResourceBundle.getText(sKey, aParams);
			},

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */
			//NOT REQUIRED AT THE MOMENT: COMMENTING OUT TO INCREASE CODE COVERAGE
			/*onShareEmailPress: function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},*/

			/**
			 * Listner for navigating back to previous hash
			 * @public
			 */
			//NOT REQUIRED AT THE MOMENT: COMMENTING OUT TO INCREASE CODE COVERAGE
			/*onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				//no history
				this.getRouter().navTo("operations", {}, true);
			}
		},*/

			initMessagePopover: function (oSettings) {
				this._oOwnerComponent = this.getOwnerComponent();
				var oMessagePopoverButtonModel = new JSONModel({
					count: 0,
					severityCount: 0,
					severityType: "Emphasized",
					severityIcon: "sap-icon://message-popup",
					visible: false
				});
				var oMessageHandlerResponseModel = new JSONModel({
					sSuccessMessage: null,
					bIsDialogOpen: false
				});
				this.getView().setModel(oMessagePopoverButtonModel, "MessagePopoverButtonModel");
				this._oMessagePopoverButtonModel = oMessagePopoverButtonModel;
				this.getView().setModel(oMessageHandlerResponseModel, "MessageHandlerResponseModel");
				this._oMessageHandlerResponseModel = oMessageHandlerResponseModel;
				this._oMessageHandler = new MessageHandler(this._oOwnerComponent, oMessagePopoverButtonModel, oMessageHandlerResponseModel, oSettings);
				this._getMessagePopover();
			},

			onMessagePopoverPress: function (oEvent) {
				this._getMessagePopover().openBy(oEvent.getSource());
			},

			_getMessagePopover: function () {
				// create popover lazily
				if (!this._oMainMessagePopover) {
					this._oMainMessagePopover = sap.ui.xmlfragment("sap.rsh.eam.lib.common.view.MessagePopOver", this);
					var oMessageManager = sap.ui.getCore().getMessageManager();
					var oMessageModel = oMessageManager.getMessageModel();
					this._oMainMessagePopover.setModel(oMessageModel);
					this.getView().addDependent(this._oMainMessagePopover);

					var aFilter = [];
					var oDisplayTypeFilter = new sap.ui.model.Filter({
						path: "displayType",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: Constants.sDisplayTypeMessagePopover
					});
					var oHandledFilter = new sap.ui.model.Filter({
						path: "handled",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: true
					});
					aFilter.push(oDisplayTypeFilter);
					aFilter.push(oHandledFilter);

					var oFilterBinding = this._oMainMessagePopover.getBinding("items");
					oFilterBinding.filter(aFilter);
					oFilterBinding.refresh();
				}
				return this._oMainMessagePopover;
			},
			/**
			 * Only to be called for named models to additionally attach Message Handler for all Metadata and Technical Errors
			 * For the default model, it is automatically done in the Message Handler constructor
			 * @param {string} sModelName model name for which error handler should be attached
			 */
			attachModelErrorHandler: function (sModelName) {
				var oModel = this.getModel(sModelName);
				if (oModel && this._oMessageHandler) {
					this._oMessageHandler.attachModelErrorHandler(oModel);
				}
			}
		});
	}
);
