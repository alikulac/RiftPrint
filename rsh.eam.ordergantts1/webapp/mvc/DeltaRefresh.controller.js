/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseViewChild.controller"], function (BaseViewChildController) {
	"use strict";

	return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.DeltaRefreshController", {
		// before cleanup: SchedulingBoard.prepareTargetForRefreshGantt
		refresh: function (oTargetParams) {
			var bActionFromMenu = this.controllers.ordergantt.operationActionSheet.isActionFromMenu();
			return this._deltaRefreshOrderGantt(oTargetParams).then(
				function (aWorkCentersToRefresh) {
					this._deltaRefreshUtilGantt(aWorkCentersToRefresh).then(
						function () {
							this._finally(oTargetParams, bActionFromMenu);
						}.bind(this)
					);
				}.bind(this)
			);
		},

		_deltaRefreshOrderGantt: function (oTargetParams) {
			var oParams = oTargetParams.parameters;
			if (oParams.bRefreshOfSourceAppRequired) {
				var oTargets = oTargetParams._itemHashMapContainer;
				var sGroupId = oParams.hasOwnProperty("sGroupId") ? oParams.sGroupId : "";
				var sChangeSetId = oParams.hasOwnProperty("sChangeSetId") ? oParams.sChangeSetId : "";
				return this.controllers.ordergantt.deltaRefresh.refresh(oTargets, sGroupId, sChangeSetId);
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

		_finally: function (oTargetParams, bActionFromMenu) {
			this.byId("idOrderGanttContainer").setBusy(false);
			var oParams = oTargetParams.parameters;
			if (oParams && oParams.bRefreshOfSourceAppRequired) {
				if (!bActionFromMenu) {
					this.controllers.ordergantt.enableToolbarButtons.disable();
					this.controllers.orderGantt.clearSelection();
				}
			}
		}
	});
});
