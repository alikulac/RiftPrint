/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/util/MockServer"], function (MockServer) {
	"use strict";

	return MockServer.extend("rsh.eam.ordergantts1.localService.MockServerExt", {
		rshRespond: function (oResponse, oParams) {
			if (this._rshFail) {
				oResponse.respondJSON(this._rshFailStatusCode, {}, this._rshFailResponse);
				this._rshFail = false;
				return false;
			} else {
				var sMethod = MockServer.HTTPMETHOD[oResponse.method];
				this.fireEvent(sMethod + ":after", {
					oXhr: oResponse
				});
				var iStatusCode = oParams.statusCode ? oParams.statusCode : 200;
				var oHeader = oParams.header ? oParams.header : {};
				var oPayload = oParams.payload
					? oParams.payload
					: {
							d: oParams.data
					  };
				var sPayload = JSON.stringify(oPayload);
				oResponse.respondJSON(iStatusCode, oHeader, sPayload);
				return true;
			}
		},

		rshFail: function (oParams) {
			var iStatusCode = oParams.statusCode ? oParams.statusCode : 400;
			var sMessage = oParams.message ? oParams.message : "failed in mockserver";
			this._rshFail = true;
			this._rshFailStatusCode = iStatusCode;
			this._rshFailResponse = {
				error: {
					code: "" + iStatusCode,
					message: sMessage,
					target: undefined
				}
			};
		}
	});
});
