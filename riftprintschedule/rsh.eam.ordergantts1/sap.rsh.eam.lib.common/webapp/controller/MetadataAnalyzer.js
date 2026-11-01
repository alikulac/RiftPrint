/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseComponent.controller"], function (BaseComponentController) {
	"use strict";

	return BaseComponentController.extend("sap.rsh.eam.lib.common.controller.MetadataAnalyzer", {
		_oProperties: undefined,

		constructor: function (oComponent, sModelName) {
			BaseComponentController.apply(this, arguments);
			this._oProperties = {};
			this._oModel = sModelName ? this.getModel(sModelName) : this.oModel;
		},

		getEntityProperties: function (sEntitySet) {
			return new Promise(
				function (resolve, reject) {
					if (this._oProperties[sEntitySet]) {
						resolve(this._oProperties[sEntitySet]);
					} else {
						var oMeta = this._oModel.getMetaModel();
						oMeta.loaded().then(
							function (oRes) {
								this._oProperties[sEntitySet] = this._getEntityProperties(sEntitySet);
								resolve(this._oProperties[sEntitySet]);
							}.bind(this),
							reject
						);
					}
				}.bind(this)
			);
		},

		_convertProperties: function (aProperties) {
			var aResult = [];

			for (var sIndex in aProperties) {
				var oProp = aProperties[sIndex];
				aResult.push({
					name: oProp.name,
					label: oProp["sap:label"],
					quickinfo: oProp["sap:quickinfo"],
					type: oProp.type,
					scale: oProp.scale,
					precision: oProp.precision,
					maxLength: oProp.maxLength,
					displayFormat: oProp["sap:display-format"],
					isNumeric: this._isNumeric(oProp.type),
					hiddenSorter: this._isTermTrue(oProp["sap:sortable"]),
					isDigitSequence: this._isTermTrue(oProp["com.sap.vocabularies.Common.v1.IsDigitSequence"]),
					nullable: !oProp.hasOwnProperty("nullable") || oProp.nullable !== "false", // nullable is only set if false,
					hiddenFilter: this._isTermTrue(oProp["com.sap.vocabularies.UI.v1.Hidden"]),
					level: oProp["sap:rsh-level"],
					fieldCatalog: oProp["sap:rsh-field-catalog"],
					sortProperty: oProp["sap:rsh-sort-property"]
				});
			}
			return aResult;
		},

		_isTermTrue: function (oTerm) {
			if (oTerm) {
				return oTerm.Bool ? oTerm.Bool !== "false" : true;
			}
			return false;
		},

		_isNumeric: function (sType) {
			return this._mNumericType[sType] ? true : false;
		},

		// from ODataType.isNumeric
		_mNumericType: {
			"Edm.Decimal": true,
			"Edm.Double": true,
			"Edm.Float": true,
			"Edm.Int16": true,
			"Edm.Int32": true,
			"Edm.Int64": true,
			"Edm.Single": true
		},

		// why not work with entity type (instead of entity set)?
		// it's names are polluted with namespace!
		_getEntityProperties: function (sEntitySet) {
			var oMeta = this._oModel.getMetaModel();
			var oEntitySet = oMeta.getODataEntitySet(sEntitySet);
			var oEntityType = oMeta.getODataEntityType(oEntitySet.entityType);
			var aProperties = this._convertProperties(oEntityType.property);
			return aProperties;
		}
	});
});
