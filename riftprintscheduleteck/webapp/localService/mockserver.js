/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/ui/core/util/MockServer",
		"rsh/eam/ordergantts1/localService/MockServerExt",
		"sap/ui/model/json/JSONModel",
		"sap/rsh/eam/lib/common/utils/URLParams",
		"rsh/eam/ordergantts1/localService/RSH_EAM_ORDER_GANTT_SRV/customMockRequests",
		"rsh/eam/ordergantts1/localService/RSH_SB_MAINTENANCE_ORDER/customMockRequests",
		"rsh/eam/ordergantts1/localService/UI_RSHPERSON/customMockRequests",
		"rsh/eam/ordergantts1/localService/RequestTracker"
	],
	function (
		MockServer,
		MockServerExt,
		JSONModel,
		URLParams,
		customMockRequestsOrderGantt,
		customMockRequestsMaintenanceOrder,
		customMockRequestsPerson,
		RequestTracker
	) {
		"use strict";

		var _sAppModulePath = "rsh/eam/ordergantts1/";
		var oMockServerOrderGantt;

		var oMockServer = {
			requestTracker: new RequestTracker(),

			init: function () {
				this._startOrderGanttMockServer();
				this._startMaintenanceOrderMockServer();
				this._startPeopleGanttMockServer();
				this._startFeatureToggleMockServer();
				this._startAnnotationMockServer();
				this._startLrepMockServer();
			},

			failForOrderGanttService: function (oParams) {
				oMockServerOrderGantt.rshFail(oParams);
			},

			_startOrderGanttMockServer: function () {
				oMockServerOrderGantt = new MockServerExt({
					rootUri: "/sap/opu/odata/sap/RSH_EAM_ORDER_GANTT_SRV/"
				});

				// configure mock server with a delay of 1s
				MockServer.config({
					autoRespond: true,
					autoRespondAfter: URLParams.get("serverDelay") || 50
				});

				// Check the uri parameter in order to switch mockdata folder
				var sMetadataUrl = sap.ui.require.toUrl(_sAppModulePath + "localService/RSH_EAM_ORDER_GANTT_SRV/metadata.xml");
				if (URLParams.get("mockdata") === "Relationship") {
					var sMockdataPath = _sAppModulePath + "localService/RSH_EAM_ORDER_GANTT_SRV/mockdataRelationship";
					var sMockdataUrl = sap.ui.require.toUrl(sMockdataPath);
					oMockServerOrderGantt.simulate(sMetadataUrl, {
						sMockdataBaseUrl: sMockdataUrl,
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
				} else if (URLParams.get("mockdata") === "NoWorkcenterAssigned") {
					var sMockdataPath = _sAppModulePath + "localService/RSH_EAM_ANALYZE_SRV/mockdataNoWorkCenter";
					var sMockdataUrl = sap.ui.require.toUrl(sMockdataPath);
					oMockServerOrderGantt.simulate(sMetadataUrl, {
						sMockdataBaseUrl: sMockdataUrl,
						aEntitySetsNames: ["C_RSHEAMUserVariant", "C_RSHUserVariantWithTeam"]
					});
				} else {
					var sMockdataPath = _sAppModulePath + "localService/RSH_EAM_ORDER_GANTT_SRV/mockdataStandard";
					var sMockdataUrl = sap.ui.require.toUrl(sMockdataPath);
					oMockServerOrderGantt.simulate(sMetadataUrl, {
						sMockdataBaseUrl: sMockdataUrl,
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
							"C_RSHWrkCtrPersonResponsibleVH",
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
							"I_MaintenanceRevisionStdVH",
							"C_RSHTechnicalObject"
						]
					});
				}

				// Add custom handlers used for the FunctionImports
				var aMyRequests = customMockRequestsOrderGantt.getRequests(oMockServerOrderGantt.getRequests(), oMockServerOrderGantt);
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
				if (URLParams.get("metadataError")) {
					aRequests.forEach(function (aEntry) {
						if (aEntry.path.toString().indexOf("$metadata") > -1) {
							fnResponse(500, "metadata Error", aEntry);
						}
					});
				}

				// Handling request errors
				var sErrorParam = URLParams.get("errorType");
				var iErrorCode = sErrorParam === "badRequest" ? 400 : 500;
				if (sErrorParam) {
					aRequests.forEach(function (aEntry) {
						if (aEntry.path.toString().indexOf("C_RSHOrdersAndOperations") > -1) {
							fnResponse(iErrorCode, sErrorParam, aEntry);
						}
					});
				}

				oMockServer.requestTracker.attachToMockServer(oMockServerOrderGantt);
				oMockServerOrderGantt.start();
			},

			//To test create relationship journey, we need to start maintenance order service
			_startMaintenanceOrderMockServer: function () {
				var sJsonFilesModulePathMaintenanceOrder = _sAppModulePath + "localService/RSH_SB_MAINTENANCE_ORDER",
					sJsonFilesUrlMaintenanceOrder = sap.ui.require.toUrl(sJsonFilesModulePathMaintenanceOrder),
					sMetadataUrlMaintenanceOrder = sap.ui.require.toUrl(_sAppModulePath + "localService/RSH_SB_MAINTENANCE_ORDER/metadata.xml");

				var oMockServerMaintenanceOrder = new MockServerExt({
					rootUri: "/sap/opu/odata/sap/RSH_SB_MAINTENANCE_ORDER/"
				});

				oMockServerMaintenanceOrder.simulate(sMetadataUrlMaintenanceOrder, {
					sMockdataBaseUrl: sJsonFilesUrlMaintenanceOrder,
					bGenerateMissingMockData: false,
					aEntitySetsNames: []
				});

				var aMyMaintOrdRequests = customMockRequestsMaintenanceOrder.getRequests(
					oMockServerMaintenanceOrder.getRequests(),
					oMockServerMaintenanceOrder
				);
				oMockServerMaintenanceOrder.setProperty("requests", aMyMaintOrdRequests);
				oMockServer.requestTracker.attachToMockServer(oMockServerMaintenanceOrder);
				oMockServerMaintenanceOrder.start();
			},

			_startPeopleGanttMockServer: function () {
				var _sJsonFilesModulePathPeople = _sAppModulePath + "localService/UI_RSHPERSON/mockdata";
				var sJsonFilesUrlPeople = sap.ui.require.toUrl(_sJsonFilesModulePathPeople),
					sMetadataUrlPeople = sap.ui.require.toUrl(_sAppModulePath + "localService/UI_RSHPERSON/metadata.xml");

				var oMockServerPeople = new MockServerExt({
					rootUri: "/sap/opu/odata/sap/UI_RSHPERSON/"
				});

				oMockServerPeople.simulate(sMetadataUrlPeople, {
					sMockdataBaseUrl: sJsonFilesUrlPeople,
					bGenerateMissingMockData: false,
					aEntitySetsNames: ["C_RSHPersonTP", "C_RSHPersonDetail", "C_RSHPersonCalendar"]
				});

				// Add custom handlers
				var aPeopleRequests = customMockRequestsPerson.getRequests(oMockServerPeople.getRequests(), oMockServerPeople);
				oMockServerPeople.setProperty("requests", aPeopleRequests);
				oMockServer.requestTracker.attachToMockServer(oMockServerPeople);
				oMockServerPeople.start();
			},

			_startFeatureToggleMockServer: function () {
				var oFeatureToggleMockServer = new MockServerExt({
					rootUri: "/sap/opu/odata/SAP/CA_FM_FEATURE_TOGGLE_STATUS_SRV/"
				});
				var aRequests = oFeatureToggleMockServer.getRequests();
				aRequests.push({
					method: "GET",
					path: new RegExp(".*ToggleStatusSet.*"),
					response: function (oResponse) {
						var oXhr = new XMLHttpRequest();
						oXhr.open("GET", "../localService/CA_FM_FEATURE_TOGGLE_STATUS_SRV/ToggleStatusSetInactive.json", false);
						oXhr.send();
						oResponse.respondJSON(200, {}, JSON.parse(oXhr.response));
						return true;
					}
				});
				oFeatureToggleMockServer.setRequests(aRequests);
				oFeatureToggleMockServer.start();
			},

			_startAnnotationMockServer: function () {
				var oAnnotationMockServer = new MockServerExt({
					rootUri: "/sap/opu/odata/iwfnd/"
				});
				var aRequests = oAnnotationMockServer.getRequests();
				aRequests.push({
					method: "GET",
					path: new RegExp(".*CATALOGSERVICE;v=0002/Annotations.*TechnicalName='RSH_EAM_ORDER_GANTT_ANNO_MD.*"),
					response: function (oResponse) {
						var oXhr = new XMLHttpRequest();
						oXhr.open("GET", "../localService/CATALOGSERVICE/Annotations_RSH_EAM_ORDER_GANTT_ANNO_MD.xml", false);
						oXhr.send();
						oResponse.respondXML(200, {}, oXhr.response);
						return true;
					}
				});
				oAnnotationMockServer.setRequests(aRequests);
				oAnnotationMockServer.start();
			},

			_startLrepMockServer: function () {
				var oLrepMockServer = new MockServerExt({
					rootUri: "/sap/bc/lrep/"
				});
				var aRequests = oLrepMockServer.getRequests();
				aRequests.push({
					method: "GET",
					path: new RegExp(".*"),
					response: function (oResponse) {
						oResponse.respondJSON(404, {}, {});
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
