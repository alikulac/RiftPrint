/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/UIComponent", "sap/base/Log", "sap/ui/model/resource/ResourceModel"], function (UIComponent, Log, ResourceModel) {
	"use strict";

	return UIComponent.extend("sap.rsh.eam.lib.common.base.BaseComponent", {
		init: function () {
			this.setModel(
				new ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				}),
				"i18nLib"
			);

			this.controllers = {};
			
			// only AFTER setting the models as this triggers the onInit of app controller where some app already need the models
			UIComponent.prototype.init.apply(this, arguments);
		},

		exit: function () {
			this._destroyControllers();
		},
		
		suspend: function () {
			this._suspendControllers();
		},
		
		restore: function () {
			this._restoreControllers();
		},
		
		_getControllers: function () {
			var aControllers = [];
			for (var sProperty in this.controllers) {
				var oValue = this.controllers[sProperty];
				var bSubNode = oValue.constructor === Object;
				if (bSubNode) {
					for (var oSubProperty in oValue) {
						aControllers.push(oValue[oSubProperty]);
					}
				} else {
					aControllers.push(oValue);
				}
			}
			return aControllers;
		},

		_destroyControllers: function () {
			var aControllers = this._getControllers();
			aControllers.forEach(function (oController) {
				this._destroyController(oController);
			}.bind(this));
		},

		_destroyController: function (oController) {
			if (oController.destroy) {
				try {
					oController.destroy();
				} catch (e) {
					Log.error("component exit failed to destroy " + oController.getMetadata().getName() + " controller. " + e);
				}
			}
		},
		
		_suspendControllers: function () {
			var aControllers = this._getControllers();
			aControllers.forEach(function (oController) {
				this._suspendController(oController);
			}.bind(this));	
		},
		
		_suspendController: function (oController) {
			if (oController.onSuspend) {
				try {
					oController.onSuspend();
				} catch (e) {
					Log.error("component suspend failed to suspend " + oController.getMetadata().getName() + " controller. " + e);
				}
			}
		},
		
		_restoreControllers: function () {
			var aControllers = this._getControllers();
			aControllers.forEach(function (oController) {
				this._restoreController(oController);
			}.bind(this));	
		},
		
		_restoreController: function (oController) {
			if (oController.onRestore) {
				try {
					oController.onRestore();
				} catch (e) {
					Log.error("component restore failed to restore " + oController.getMetadata().getName() + " controller. " + e);
				}
			}
		}		
	});
});
