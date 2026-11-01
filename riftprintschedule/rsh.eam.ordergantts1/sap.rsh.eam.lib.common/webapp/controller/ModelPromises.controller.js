/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseComponent.controller"], function (BaseComponentController) {
	"use strict";

	/**
	 * Wraps functions of the ODataModel with promises
	 */
	return BaseComponentController.extend("sap.rsh.eam.lib.common.controller.ModelPromises.controller", {
		read: function (oParams) {
			return new Promise(
				function (resolve, reject) {
					var oModel = this.getModel(oParams.modelName);
					oModel.read(oParams.path, {
						filters: oParams.filters,
						sorters: oParams.sorters,
						urlParameters: oParams.urlParameters,
						groupId: oParams.groupId,
						success: resolve,
						error: reject
					});
				}.bind(this)
			);
		},

		callFunction: function (oParams) {
			return new Promise(
				function (resolve, reject) {
					var oModel = this.getModel(oParams.modelName);
					var sMethod = oParams.method ? oParams.method : "POST";
					oModel.callFunction(oParams.path, {
						method: sMethod,
						urlParameters: oParams.urlParameters,
						groupId: oParams.groupId,
						changeSetId: oParams.changeSetId,
						success: resolve,
						error: reject
					});
				}.bind(this)
			);
		},

		create: function (oParams) {
			return new Promise(
				function (resolve, reject) {
					var oModel = this.getModel(oParams.modelName);
					oModel.create(oParams.path, oParams.data, {
						urlParameters: oParams.urlParameters,
						groupId: oParams.groupId,
						changeSetId: oParams.changeSetId,
						refreshAfterChange: oParams.refreshAfterChange,
						success: resolve,
						error: reject
					});
				}.bind(this)
			);
		},

		update: function (oParams) {
			return new Promise(
				function (resolve, reject) {
					var oModel = this.getModel(oParams.modelName);
					oModel.update(oParams.path, oParams.data, {
						urlParameters: oParams.urlParameters,
						groupId: oParams.groupId,
						changeSetId: oParams.changeSetId,
						refreshAfterChange: oParams.refreshAfterChange,
						success: resolve,
						error: reject
					});
				}.bind(this)
			);
		},

		remove: function (oParams) {
			return new Promise(
				function (resolve, reject) {
					var oModel = this.getModel(oParams.modelName);
					oModel.remove(oParams.path, {
						urlParameters: oParams.urlParameters,
						groupId: oParams.groupId,
						changeSetId: oParams.changeSetId,
						refreshAfterChange: oParams.refreshAfterChange,
						success: resolve,
						error: reject
					});
				}.bind(this)
			);
		},

		submitChanges: function (oParams) {
			return new Promise(
				function (resolve, reject) {
					var oModel = this.getModel(oParams.modelName);
					oModel.submitChanges({
						groupId: oParams.groupId,
						success: resolve,
						error: reject
					});
				}.bind(this)
			);
		}
	});
});
