/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object"], function (UI5Object) {
	"use strict";

	return UI5Object.extend("zrift.rsh.eam.ordergantts1.localService.RequestTracker", {
		_aRequests: undefined,

		constructor: function () {
			this._aRequests = [];
		},

		attachToMockServer: function (oMockServer) {
			oMockServer.attachAfter("GET", this._trackRequest.bind(this));
			oMockServer.attachAfter("POST", this._trackRequest.bind(this));
			oMockServer.attachAfter("DELETE", this._trackRequest.bind(this));
		},

		// maximum number of tracked requests is 20. older will be discarded
		_trackRequest: function (oEvent) {
			var oXhr = oEvent.getParameter("oXhr");
			try {
				var oTrackedRequest = this._createTrackedRequest(oXhr);
				this._aRequests.push(oTrackedRequest);
			} catch (e) {}
			if (this._aRequests.length >= 40) {
				this._aRequests.splice(0, 20);
			}
			console.dir(oTrackedRequest);
		},

		_createTrackedRequest: function (oXhr) {
			var sUrl = decodeURI(oXhr.url);
			var aUrlSplit = sUrl.split("?");
			var sResourceSplit = aUrlSplit[0].replace("/sap/opu/odata/sap/", "");
			var oRequest = {
				url: sUrl,
				method: oXhr.method,
				service: sResourceSplit.split("/")[0],
				resource: sResourceSplit.length > 0 ? sResourceSplit.split("/")[1] : null,
				body: oXhr.requestBody ? JSON.parse(oXhr.requestBody) : null
			};
			var aParameters = aUrlSplit.length > 0 && aUrlSplit[1] ? aUrlSplit[1].split("&") : [];
			for (var i = 0; i < aParameters.length; i++) {
				var aParameterSplit = aParameters[i].split("=");
				var sParameterName = aParameterSplit[0].replace("$", "");
				var sParameterValue = aParameterSplit.length > 0 ? aParameterSplit[1] : null;
				oRequest[sParameterName] = sParameterValue;
			}
			return oRequest;
		},

		reset: function () {
			this._aRequests = [];
		},

		getRequestCount: function () {
			return this._aRequests.length;
		},

		getRequest: function (iIndex) {
			return iIndex < this._aRequests.length ? this._aRequests[iIndex] : null;
		},

		getLog: function () {
			var sResult = "\n\nrequests:\n";
			for (var i = 0; i < this._aRequests.length; i++) {
				sResult += this._aRequests[i].url + "\n";
			}
			sResult += "\n";
			return sResult;
		}
	});
});
