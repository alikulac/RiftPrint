/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("sap.rsh.eam.lib.common.variant.CustomVariant.controller", {
		constructor: function (oParams) {
			BaseViewChildController.call(this, oParams.parent);
			this._oVariantHandler = oParams.variantHandler;
		},

		onInitMembers: function () {
			this._oData = undefined; // before cleanup: _oCustomSettingsData
			this._bSubmittingUpdates = undefined;
		},

		attachInitChanges: function (fnHandler, oListener) {
			this.attachEvent("initChanges", fnHandler, oListener);
		},

		attachHandleChanges: function (fnHandler, oListener) {
			this.attachEvent("handleChanges", fnHandler, oListener);
		},

		initChanges: function () {
			if (!this._oData) {
				this._initChanges();
			}
		},

		updateProperty: function (sPath, oValue) {
			this._updateObjectByPath(this._oData, "/newData" + sPath, oValue);
		},

		submitUpdates: function () {
			this._bSubmittingUpdates = true;
			this._oVariantHandler.setData(this._oData);
		},

		_updateObjectByPath: function (oObject, sPath, oValue) {
			var aPath = sPath.split("/");
			aPath.shift();
			while (aPath.length > 1) {
				var sPathPart = aPath.shift();
				oObject = oObject[sPathPart];
			}
			var sPropertyName = aPath.shift();
			oObject[sPropertyName] = oValue;
		},

		// before cleanup: SchedulingBoard.applyCustomVariantChanges
		onApplyChange: function (oEvent) {
			var oChange = oEvent.getParameter("change");
			var oContent = oChange.getContent();
			this._handleChanges(oContent.newData, true);
			if (!this._oData) {
				this._initChanges();
			}
			Object.keys(oContent.newData).forEach(
				function (sItem) {
					this._oData.newData[sItem] = oContent.newData[sItem];
				}.bind(this)
			);
		},

		// before cleanup: SchedulingBoard.revertCustomVariantChanges
		onRevertChange: function (oEvent) {
			var oChange = oEvent.getParameter("change");
			var oContent = oChange.getContent();
			this._handleChanges(oContent.oldData, false);
			if (!this._oData) {
				this._initChanges();
			}
			Object.keys(oContent.oldData).forEach(
				function (sItem) {
					this._oData.oldData[sItem] = oContent.oldData[sItem];
				}.bind(this)
			);
		},

		_initChanges: function () {
			this._oData = {
				oldData: {},
				newData: {}
			};
			this.fireEvent("initChanges", {
				oldData: this._oData.oldData,
				newData: this._oData.newData
			});
		},

		_handleChanges: function (oData, bApply) {
			// don't fire change events when the app is updating the custom variant !
			// otherwise the app would apply the same state again without need.
			// that would not be a problem when setting properties on controls again (UI5 ignores that)
			// but e.g. changing the GanttContainer's view state would remove all gantt's from the container
			if (this._bSubmittingUpdates) {
				this._bSubmittingUpdates = false;
			} else {
				this.fireEvent("handleChanges", {
					data: oData,
					apply: bApply
				});
			}
		}
	});
});
