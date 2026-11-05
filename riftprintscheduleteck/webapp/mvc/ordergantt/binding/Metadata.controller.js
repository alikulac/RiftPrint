/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/odata/MetadataAnalyzer"],
	function (BaseViewChildController, MetadataAnalyzer) {
		"use strict";

		/**
		 * Uses OData metadata to decide for an extended field if it is on order or operation level.
		 * This mechanism is not applicable to standards fields.
		 */
		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.binding.Metadata.controller", {
			onInitMembers: function () {
				this._oMetadataAnalyzer = new MetadataAnalyzer(this.oComponent);
				this._aOrderExtensionFields = undefined; // before cleanup: aOrderLvlPropFrmMetadata
				this._aOperationExtensionFields = undefined; // before cleanup: aOpLvlPropFrmMetadata
			},

			isOrderExtensionField: function (sField) {
				return !!this._aOrderExtensionFields && this._aOrderExtensionFields.indexOf(sField) !== -1;
			},

			isOperationExtensionField: function (sField) {
				return !!this._aOperationExtensionFields && this._aOperationExtensionFields.indexOf(sField) !== -1;
			},

			// before cleanup: SchedulingBoard.onInit
			init: function () {
				return this._oMetadataAnalyzer.getEntityProperties("C_RSHOrdersAndOperations").then(this._afterMetadataAnalyzed.bind(this));
			},

			// before cleanup: SchedulingBoard._afterPropsFetchedFrmMetadata
			_afterMetadataAnalyzed: function (aOrderOpProperties) {
				this._aOrderExtensionFields = [];
				this._aOperationExtensionFields = [];
				for (var i = 0; i < aOrderOpProperties.length; i++) {
					if (aOrderOpProperties[i].level === "0") {
						this._aOrderExtensionFields.push(aOrderOpProperties[i].name);
					} else if (aOrderOpProperties[i].level === "1") {
						this._aOperationExtensionFields.push(aOrderOpProperties[i].name);
					}
				}
				return aOrderOpProperties;
			}
		});
	}
);
