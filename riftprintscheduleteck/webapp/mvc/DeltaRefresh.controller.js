/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.DeltaRefreshController", {
		// before cleanup: SchedulingBoard.prepareTargetForRefreshGantt
		refresh: function (oParams) {
			var [bRefresh, oRefreshParams] = this._getRefreshParams(oParams);
			var bActionFromMenu = this.controllers.ordergantt.operationActionSheet.isActionFromMenu();
			return this._deltaRefreshOrderGantt(bRefresh, oRefreshParams).then(
				function (aWorkCentersToRefresh) {
					this._deltaRefreshUtilGantt(aWorkCentersToRefresh).then(
						function () {
							this._finally(bRefresh, bActionFromMenu);
						}.bind(this)
					);
				}.bind(this)
			);
		},

		_getRefreshParams: function (oParams) {
			var oRefreshParams;
			var bRefresh;
			var bCallMap = oParams.getMetadata && oParams.getMetadata().getName().indexOf("ChangeOperationCallMap") !== -1;
			if (bCallMap) {
				oRefreshParams = this._getRefreshParamsByCallMap(oParams);
				bRefresh = oParams.parameters.bRefreshOfSourceAppRequired;
			} else {
				oRefreshParams = oParams;
				bRefresh = true;
			}
			return [bRefresh, oRefreshParams];
		},

		_getRefreshParamsByCallMap: function (oCallMap) {
			var oMapParams = oCallMap.parameters;
			var oParams = {
				fetchAllOps: false,
				orderOps: [],
				groupId: oMapParams.sGroupId ? oMapParams.sGroupId : undefined,
				changeSetId: oMapParams.sChangeSetId ? oMapParams.sChangeSetId : undefined
			};

			var aCalls = oCallMap.getCalls();
			for (var i = 0; i < aCalls.length; i++) {
				var oCall = aCalls[i];
				var sAction = oCall.getAction();
				var oOperation = oCall.getOperation();

				if (!oParams.fetchAllOps) {
					oParams.fetchAllOps = !(sAction === "dispatch" || sAction === "cancelDispatch");
				}

				var bWorkCenterChanged = sAction === "changeWorkCenter";
				var bCheckCrossOrders = sAction === "reschedule" || sAction === "removeConstraints";
				oParams.orderOps.push({
					order: oOperation.MaintenanceOrder,
					orderOperation: oOperation.MaintenanceOrderOperation,
					workCenterChanged: bWorkCenterChanged,
					checkCrossOrders: bCheckCrossOrders
				});
			}

			return oParams;
		},

		_deltaRefreshOrderGantt: function (bRefresh, oRefreshParams) {
			if (bRefresh) {
				return this.controllers.ordergantt.deltaRefresh.refresh(oRefreshParams);
			} else {
				return Promise.resolve();
			}
		},

		_deltaRefreshUtilGantt: function (aWorkCentersToRefresh) {
			var bUtilGanttLoaded = this.controllers.utilizationGantt.isLoaded();
			var bRefreshUtilGantt = bUtilGanttLoaded && aWorkCentersToRefresh && aWorkCentersToRefresh.length > 0;
			if (bRefreshUtilGantt) {
				return this.controllers.utilizationGantt.deltaRefresh(aWorkCentersToRefresh);
			} else {
				return Promise.resolve();
			}
		},

		_finally: function (bRefresh, bActionFromMenu) {
			this.byId("idOrderGanttContainer").setBusy(false);
			if (bRefresh) {
				if (!bActionFromMenu) {
					this.controllers.ordergantt.enableToolbarButtons.disable();
					this.controllers.orderGantt.clearSelection();
				}
			}
		}
	});
});
