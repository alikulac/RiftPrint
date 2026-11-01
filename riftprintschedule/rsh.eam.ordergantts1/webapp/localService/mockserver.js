/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/core/util/MockServer",
		"rsh/eam/ordergantts1/localService/customMockRequests",
		"rsh/eam/ordergantts1/localService/customMockRequestsForMaintenanceOrder",
		"rsh/eam/ordergantts1/localService/customPersonMockRequests",
		"sap/base/Log"
	],
	function (MockServer, CustomizedMockRequests, customMockReqMaintOrd, customPersonMockRequests, Log) {
		"use strict";
		var oMockServerOrderGantt,
			oAnnotationMockServer,
			oMockServerMaintenanceOrder,
			oFeatureToggleMockServer,
			oMockServerPeople,
			_sAppModulePath = "rsh/eam/ordergantts1/",
			_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata",
			_sJsonFilesModulePathMaintenanceOrder = _sAppModulePath + "localService/mockdataMaintenanceOrder",
			_sJsonFilesModulePathPeople = _sAppModulePath + "localService/mockdataPerson",
			aTrackedRequests = [];

		var oMockServer = {
			/**
			 * Initializes the mock server.
			 * You can configure the delay with the URL parameter "serverDelay".
			 * The local mock data in this folder is returned instead of the real data for testing.
			 * @public
			 */
			init: function () {
				var oUriParameters = jQuery.sap.getUriParameters(),
					sJsonFilesUrl = sap.ui.require.toUrl(_sJsonFilesModulePath),
					sManifestUrl = sap.ui.require.toUrl(_sAppModulePath + "manifest.json"),
					sEntity = "C_RSHOrdersAndOperations",
					sErrorParam = oUriParameters.get("errorType"),
					iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
					oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
					oMainDataSource = oManifest["sap.app"].dataSources.RSH_EAM_ORDER_GANTT_SRV,
					oDataSource = oManifest["sap.app"].dataSources,
					sMetadataUrl = sap.ui.require.toUrl(_sAppModulePath + oMainDataSource.settings.localUri),
					// ensure there is a trailing slash
					sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/",
					aAnnotations = oMainDataSource.settings.annotations || [],
					sAnnotationName = aAnnotations[0];

				oMockServerOrderGantt = new MockServer({
					rootUri: sMockServerUrl
				});

				// configure mock server with a delay of 1s
				MockServer.config({
					autoRespond: true,
					autoRespondAfter: oUriParameters.get("serverDelay") || 1000
				});

				//Check the uri parameter in order to switch mockdata folder
				if (oUriParameters.get("journey") === "ScheduleOrders" || oUriParameters.get("journey") === "Relationships") {
					_sJsonFilesModulePath = _sAppModulePath + "localService/mockdataRelationship";
					sJsonFilesUrl = sap.ui.require.toUrl(_sJsonFilesModulePath);
					oMockServerOrderGantt.simulate(sMetadataUrl, {
						sMockdataBaseUrl: sJsonFilesUrl,
						/*	bGenerateMissingMockData: true,*/
						aEntitySetsNames: [
							"C_RSHOperationRelationships",
							"C_RSHOrdersAndOperations",
							"C_RSHEAMUserVariant",
							"C_RSHUserVariantWithTeam",
							"C_RSHUnitOfMeasureTimeVH",
							"I_MaintenanceRevisionStdVH"
						]
					});
				} else {
					// load local mock data
					oMockServerOrderGantt.simulate(sMetadataUrl, {
						sMockdataBaseUrl: sJsonFilesUrl,
						/*bGenerateMissingMockData: true,*/
						aEntitySetsNames: [
							"C_MaintOrderTypeVH",
							"C_RSHEAMUserVariant",
							"C_RSHUserVariantWithTeam",
							"C_RSHEditDispatchOptionVH",
							"C_RSHEditWorkCenterVH",
							"C_RSHOperationActiveUserStatus",
							"C_RSHOperationActivityTypeVH",
							"C_RSHOperationDetails",
							"C_RSHOperationHasErrorVH",
							"C_RSHOperationProcessStatusVH",
							"C_RSHOperationRelationships",
							"C_RSHOperations",
							"C_RSHOperationValidation",
							"C_RSHOpInMaintSchedSimulation",
							"C_RSHOrderActiveUserStatus",
							"C_RSHOrderDetails",
							"C_RSHOrderGanttCalendar",
							"C_RSHOrderGanttCalendarSet",
							"C_RSHOrderGanttNonWrkgTmeIntvl",
							"C_RSHOrderHasLongTextVH",
							"C_RSHOrderMaterialStatusVH",
							"C_RSHOrderPriorityVH",
							"C_RSHOrders",
							"C_RSHOrdersAndOperations",
							"C_RSHPlngBucketAndEventDetails",
							"C_RSHWorkCenterVH",
							"C_RSHWorkCtrUtilization",
							"C_RSHWorkCtrUtilznIndicator",
							"I_DraftAdministrativeData",
							"I_Equipment",
							"I_FunctionalLocation",
							"I_MaintenanceActivityTypeText",
							"I_MaintenanceOrder",
							"I_MaintenanceOrderOperation",
							"I_MaintOrderOperationTP",
							"I_MaintOrderSubOperationTP",
							"I_MaintOrderTP",
							"I_OperationControlProfile",
							"I_WorkCenter",
							"I_WorkCenterType",
							"I_MaintenanceRevisionStdVH"
						]
					});
				}
				// Add custom handlers used for the FunctionImports.
				var aMyRequests = CustomizedMockRequests.getRequests(oMockServerOrderGantt.getRequests(), oMockServerOrderGantt);
				oMockServerOrderGantt.setProperty("requests", aMyRequests);

				var aRequests = aMyRequests,
					fnResponse = function (iErrCode, sMessage, aRequest) {
						aRequest.response = function (oXhr) {
							oXhr.respond(
								iErrCode,
								{
									"Content-Type": "text/plain;charset=utf-8"
								},
								sMessage
							);
						};
					};

				// handling the metadata error test
				if (oUriParameters.get("metadataError")) {
					aRequests.forEach(function (aEntry) {
						if (aEntry.path.toString().indexOf("$metadata") > -1) {
							fnResponse(500, "metadata Error", aEntry);
						}
					});
				}

				// Handling request errors
				if (sErrorParam) {
					aRequests.forEach(function (aEntry) {
						if (aEntry.path.toString().indexOf(sEntity) > -1) {
							fnResponse(iErrorCode, sErrorParam, aEntry);
						}
					});
				}
				//To test create relationship journey, we need to start maintenance order service
				var sJsonFilesUrlMaintenanceOrder = sap.ui.require.toUrl(_sJsonFilesModulePathMaintenanceOrder),
					sMetadataUrlMaintenanceOrder = sap.ui.require.toUrl(_sAppModulePath + "localService/RSH_SB_MAINTENANCE_ORDER/metadata.xml"),
					sMockServerUrlMaintenanceOrder = "/sap/opu/odata/sap/RSH_SB_MAINTENANCE_ORDER/";
				oMockServerMaintenanceOrder = new MockServer({
					rootUri: sMockServerUrlMaintenanceOrder
				});

				oMockServerMaintenanceOrder.simulate(sMetadataUrlMaintenanceOrder, {
					sMockdataBaseUrl: sJsonFilesUrlMaintenanceOrder,
					bGenerateMissingMockData: false,
					aEntitySetsNames: []
				});

				var aMyMaintOrdRequests = customMockReqMaintOrd.getRequests(oMockServerMaintenanceOrder.getRequests(), oMockServerMaintenanceOrder);
				oMockServerMaintenanceOrder.setProperty("requests", aMyMaintOrdRequests);
				oMockServerMaintenanceOrder.attachAfter("GET", oMockServer._trackRequest);
				oMockServerMaintenanceOrder.attachAfter("POST", oMockServer._trackRequest);
				oMockServerMaintenanceOrder.start();

				oMockServerOrderGantt.attachAfter("GET", oMockServer._trackRequest);
				oMockServerOrderGantt.attachAfter("POST", oMockServer._trackRequest);
				oMockServerOrderGantt.start();

				//Add mockserver for People gantt
				var sJsonFilesUrlPeople = sap.ui.require.toUrl(_sJsonFilesModulePathPeople),
					sMetadataUrlPeople = sap.ui.require.toUrl(_sAppModulePath + "localService/UI_RSHPERSON/metadata.xml"),
					sMockServerUrlPeople = "/sap/opu/odata/sap/UI_RSHPERSON/";
				oMockServerPeople = new MockServer({
					rootUri: sMockServerUrlPeople
				});

				// configure mock server with a delay of 1s
				MockServer.config({
					autoRespond: true,
					autoRespondAfter: oUriParameters.get("serverDelay") || 1000
				});

				oMockServerPeople.simulate(sMetadataUrlPeople, {
					sMockdataBaseUrl: sJsonFilesUrlPeople,
					bGenerateMissingMockData: false,
					aEntitySetsNames: ["C_RSHPersonTP", "C_RSHPersonDetail", "C_RSHPersonCalendar"]
				});

				// Add custom handlers
				var aPeopleRequests = customPersonMockRequests.getRequests(oMockServerPeople.getRequests(), oMockServerPeople);
				oMockServerPeople.setProperty("requests", aPeopleRequests);
				oMockServerPeople.attachAfter("GET", oMockServer._trackRequest);
				oMockServerPeople.attachAfter("POST", oMockServer._trackRequest);
				oMockServerPeople.start();

				// Mockserver for Feature Toggle Request
				oFeatureToggleMockServer = new MockServer({
					rootUri: "/sap/opu/odata/"
				});

				// Active Feature Toggle:
				var sUrl = "../localService/CA_FM_FEATURE_TOGGLE_STATUS_SRV/ToggleStatusSetInactive.json";

				var aFeatureToggleRequests = oFeatureToggleMockServer.getRequests();
				aFeatureToggleRequests.push({
					method: "GET",
					path: new RegExp(".*CA_FM_FEATURE_TOGGLE_STATUS_SRV/ToggleStatusSet.*"),
					response: function (oXhr, sUrlParams) {
						var oResponse = jQuery.sap.sjax({
							url: sUrl
						});
						var oResult = oResponse.data;
						oXhr.respondJSON(200, {}, oResult);
						return true;
					}
				});

				oFeatureToggleMockServer.setRequests(aFeatureToggleRequests);
				oFeatureToggleMockServer.start();

				// Mockserver for Annotation file
				oAnnotationMockServer = new MockServer({
					rootUri: "/sap/opu/odata/iwfnd/"
				});

				var sAnnotationLocalUri = sap.ui.require.toUrl(_sAppModulePath + oDataSource[sAnnotationName].settings.localUri);

				var aAnnotationRequests = oAnnotationMockServer.getRequests();
				aAnnotationRequests.push({
					method: "GET",
					path: new RegExp(".*CATALOGSERVICE.*"),
					response: function (oXhr, sUrlParams) {
						var oResponse = jQuery.sap.sjax({
							url: sAnnotationLocalUri
						});
						var oResult = oResponse.data;
						oXhr.respondJSON(200, {}, oResult);
						return true;
					}
				});

				oAnnotationMockServer.setRequests(aAnnotationRequests);
				oAnnotationMockServer.start();

				this._startLrepMockServer();

				Log.info("Running the app with mock data");
			},

			/**
			 * @public returns the mockserver of the app, should be used in integration tests
			 * @returns {sap.ui.core.util.MockServer} the mockserver instance
			 */
			getMockServer: function () {
				return oMockServerOrderGantt;
			},

			// maximum number of tracked requests is 20. older will be discarded
			_trackRequest: function (oEvent) {
				var oXhr = oEvent.getParameter("oXhr");
				var oTrackedRequest = oMockServer._createTrackedRequest(oXhr);
				aTrackedRequests.push(oTrackedRequest);
				if (aTrackedRequests.length >= 40) {
					aTrackedRequests.splice(0, 20);
				}
				console.dir(oTrackedRequest);
			},

			_createTrackedRequest: function (oXhr) {
				var sUrl = decodeURI(oXhr.url);
				var aUrlSplit = sUrl.split("?");
				var sResourceSplit = aUrlSplit[0].replace("/sap/opu/odata/sap/", "");
				var oRequest = {
					url: sUrl,
					service: sResourceSplit.split("/")[0],
					resource: sResourceSplit.length > 0 ? sResourceSplit.split("/")[1] : null,
					body: oXhr.requestBody ? JSON.parse(oXhr.requestBody) : null
				};
				var aParameters = ( aUrlSplit.length > 0 && aUrlSplit[1] ) ? aUrlSplit[1].split("&") : [];
				for (var i = 0; i < aParameters.length; i++) {
					var aParameterSplit = aParameters[i].split("=");
					var sParameterName = aParameterSplit[0].replace("$", "");
					var sParameterValue = aParameterSplit.length > 0 ? aParameterSplit[1] : null;
					oRequest[sParameterName] = sParameterValue;
				}
				return oRequest;
			},

			resetTrackedRequests: function () {
				aTrackedRequests = [];
			},

			getTrackedRequestCount: function () {
				return aTrackedRequests.length;
			},

			getTrackedRequest: function (iIndex) {
				return iIndex < aTrackedRequests.length ? aTrackedRequests[iIndex] : null;
			},

			getTrackedRequestsLog: function () {
				var sResult = "\n\nrequests:\n";
				for (var i = 0; i < aTrackedRequests.length; i++) {
					sResult += aTrackedRequests[i].url + "\n";
				}
				sResult += "\n";
				return sResult;
			},

			_startLrepMockServer: function () {
				var oLrepMockServer = new MockServer({
					rootUri: "/sap/bc/lrep/"
				});
				var aRequests = oLrepMockServer.getRequests();
				aRequests.push({
					method: "GET",
					path: new RegExp(".*"),
					response: function (oXhr) {
						oXhr.respondJSON(404, {}, {});
						return true;
					}
				});
				oLrepMockServer.setRequests(aRequests);
				oLrepMockServer.start();
			}
		};

		return oMockServer;
	}
);
