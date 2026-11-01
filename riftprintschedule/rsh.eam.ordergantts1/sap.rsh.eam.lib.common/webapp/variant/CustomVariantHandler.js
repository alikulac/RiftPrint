/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/gantt/simple/CustomVariantHandler"], function (CustomVariantHandler) {
	"use strict";

	return CustomVariantHandler.extend("sap.rsh.eam.lib.common.variant.CustomVariantHandler", {
		metadata: {
			events: {
				applyChange: {},
				revertChange: {}
			}
		},

		apply: function (oChange, oControl, mPropertyBag) {
			this.fireEvent("applyChange", { change: oChange });
		},

		revert: function (oChange, oControl, mPropertyBag) {
			this.fireEvent("revertChange", { change: oChange });
		}
	});
});
