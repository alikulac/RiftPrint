/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/utils/utils"],
	function (BaseViewChildController, Utils) {
		"use strict";

		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.filterbar.FilterBarSearch.controller", {
			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this._setModelGroups();
			},

			onInitMembers: function () {
				this._bSubmitofDeferredRequestsDone = false;
				this.oTreeTable = this.byId("idOrderTreeTable");
			},

			_setModelGroups: function () {
				this.oModel.setDeferredGroups(this.oModel.getDeferredGroups().concat(["iDBatchOrderFilterRequest"]));
				this.oModel.setChangeGroups({
					C_RSHOrdersAndOperationsType: {
						groupId: "iDBatchOrderFilterRequest",
						changeSetId: "iDBatchOrderFilterRequest",
						single: false
					}
				});
				this.oModel.setDeferredGroups(this.oModel.getDeferredGroups().concat(["iDBatchUtilization"]));
				this.oModel.setChangeGroups({
					C_RSHWorkCtrUtilizationType: {
						groupId: "iDBatchUtilization",
						changeSetId: "iDBatchUtilization",
						single: false
					}
				});
			},

			submitOfDeferredRequestsDone: function () {
				return this._bSubmitofDeferredRequestsDone;
			},

			/*
			 * the startup sequence depends on the type of variant
			 *  (a) for a standard variant the onGanttVariantApplied is called before onSmartFilterInitialized
			 *  (b) for a user variant the onSmartFilterInitialized is called before onGanttVariantApplied
			 * to accommodate (b) we have to wait here for the initialization of the gantt variant
			 */
			search: function () {
				var pSystemTimeZoneLoaded = this.controllers.systemTimeZone.loaded();
				var pInitialVariantApplied = this.controllers.ganttVariant.initialVariantApplied();
				var pAll = Promise.all([pSystemTimeZoneLoaded, pInitialVariantApplied]);
				pAll.then(this._search.bind(this));
			},

			// before cleanup: SchedulingBoard.onFilter
			_search: function () {
				this.controllers.message.removeAllMessages();

				this.controllers.orderGantt.enableNoDataStyle(false);
				this.controllers.utilizationGantt.enableNoDataStyle(false);

				this.controllers.orderGantt.setTimeAxis();
				this.controllers.utilizationGantt.setTimeAxis();

				var bDataLoadedOnce = true;
				this.controllers.orderGantt.setNoDataText(bDataLoadedOnce);
				this.controllers.utilizationGantt.setNoDataText(bDataLoadedOnce);

				this.controllers.ordergantt.binding.setModelSizeLimit();

				this.controllers.ordergantt.binding.refreshBinding({ filtersChanged: true, force: false });
				this.controllers.utilizationGantt.refreshBinding();

				this.controllers.ordergantt.calendarBinding.bind(false);

				if (!this._bSubmitofDeferredRequestsDone) {
					this._submitDeferredRequestsFirstTime();
					this._bSubmitofDeferredRequestsDone = true;
				} else {
					this._submitDeferredRequests();
				}

				this.controllers.ordergantt.enableToolbarButtons.disable();

				this.controllers.ganttContainer.setDataOutdated(false);
			},

			// before cleanup: SchedulingBoard._submitDelayedRequests
			_submitDeferredRequestsFirstTime: function () {
				var aCurrentDeferredBatchGroups = this.oModel.getDeferredGroups();
				var indexOfOrderFilterGroup, indexOfUtilGroup;
				this.oModel.submitChanges({
					groupId: "iDBatchOrderFilterRequest"
				});
				this.oModel.submitChanges({
					groupId: "iDBatchUtilization"
				});
				indexOfOrderFilterGroup = aCurrentDeferredBatchGroups.indexOf("iDBatchOrderFilterRequest");
				aCurrentDeferredBatchGroups.splice(indexOfOrderFilterGroup, 1);
				indexOfUtilGroup = aCurrentDeferredBatchGroups.indexOf("iDBatchUtilization");
				aCurrentDeferredBatchGroups.splice(indexOfUtilGroup, 1);
				this.oModel.setDeferredGroups(aCurrentDeferredBatchGroups);
			},

			// before cleanup: SchedulingBoard.applyAndTriggerFinalFilter
			_submitDeferredRequests: function () {
				var sViewKey = this.controllers.ganttContainer.getViewKey();
				var aCurrentDeferredBatchGroups = this.oModel.getDeferredGroups();
				var indexOfOrderFilterGroup, indexOfUtilGroup;
				if (sViewKey === "Orders") {
					if (!aCurrentDeferredBatchGroups.includes("iDBatchOrderFilterRequest")) {
						aCurrentDeferredBatchGroups = aCurrentDeferredBatchGroups.concat("iDBatchOrderFilterRequest");
						this.oModel.setDeferredGroups(aCurrentDeferredBatchGroups);
					}
					this.oModel.submitChanges({
						groupId: "iDBatchOrderFilterRequest"
					});
					indexOfOrderFilterGroup = aCurrentDeferredBatchGroups.indexOf("iDBatchOrderFilterRequest");
					aCurrentDeferredBatchGroups.splice(indexOfOrderFilterGroup, 1);
					this.oModel.setDeferredGroups(aCurrentDeferredBatchGroups.concat("iDBatchUtilization"));
				} else {
					if (!aCurrentDeferredBatchGroups.includes("iDBatchOrderFilterRequest") && !aCurrentDeferredBatchGroups.includes("iDBatchUtilization")) {
						aCurrentDeferredBatchGroups = aCurrentDeferredBatchGroups.concat("iDBatchOrderFilterRequest", "iDBatchUtilization");
						this.oModel.setDeferredGroups(aCurrentDeferredBatchGroups);
					}
					this.oModel.submitChanges({
						groupId: "iDBatchOrderFilterRequest"
					});
					this.oModel.submitChanges({
						groupId: "iDBatchUtilization"
					});
					indexOfOrderFilterGroup = aCurrentDeferredBatchGroups.indexOf("iDBatchOrderFilterRequest");
					aCurrentDeferredBatchGroups.splice(indexOfOrderFilterGroup, 1);
					indexOfUtilGroup = aCurrentDeferredBatchGroups.indexOf("iDBatchUtilization");
					aCurrentDeferredBatchGroups.splice(indexOfUtilGroup, 1);
					this.oModel.setDeferredGroups(aCurrentDeferredBatchGroups);
				}
			},

			submitDeferredRequestsUtilization: function () {
				//After we click "Go" second time onwards along with setting up the pending filters and if we change the view switch from
				//"Orders" to "Orders and Resources" submit the changes for the Util Gantt to filter the data accordingly.
				var aCurrentDeferredBatchGroups = this.oModel.getDeferredGroups();
				var bSubmitChanges = aCurrentDeferredBatchGroups.includes("iDBatchUtilization") && this._bSubmitofDeferredRequestsDone;
				if (bSubmitChanges) {
					this.oModel.submitChanges({
						groupId: "iDBatchUtilization"
					});
					var iIndexOfUtilGroup = aCurrentDeferredBatchGroups.indexOf("iDBatchUtilization");
					aCurrentDeferredBatchGroups.splice(iIndexOfUtilGroup, 1);
					this.oModel.setDeferredGroups(aCurrentDeferredBatchGroups);
				}
			}
		});
	}
);
