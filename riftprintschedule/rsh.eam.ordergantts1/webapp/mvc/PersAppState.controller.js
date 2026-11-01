/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/PersAppState.controller",
		"sap/rsh/eam/lib/common/utils/AppPersContainer",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/FilterInformationDialogUtil"
	],
	function (PersAppStateController, AppPersContainer, Utils, Constants, FilterInformationDialogUtil) {
		"use strict";

		return PersAppStateController.extend("rsh.eam.ordergantts1.mvc.PersAppState.controller", {
			onInit: function () {
				PersAppStateController.prototype.onInit.apply(this, arguments);
				var oPersContainer = AppPersContainer.getInstance();
				this._pInitialized = oPersContainer.initialized().then(this._init.bind(this));
			},

			onInitMembers: function () {
				PersAppStateController.prototype.onInitMembers.apply(this, arguments);
				this._pInitialized = undefined;
				this._oData = undefined; // before cleanup: _oAppStateData
				this._bAppliedDefault = false;
			},

			_getTable: function () {
				return this.byId("idOrderTreeTable");
			},

			_getGantt: function () {
				return this.byId("idOrderGanttChartWithTable");
			},

			initialized: function () {
				return this._pInitialized;
			},

			// before cleanup: SchedulingBoard.onInit
			_init: function (oPersContainer) {
				var oFeatureModel = oPersContainer.getFeatureModel(Constants.sGanttAppState);
				this._oData = oFeatureModel.getData();
				var bUserUsesAppFirstTime = this._oData.customData === undefined;
				//Required only once for fresh app state
				if (Utils.isMockRun() || bUserUsesAppFirstTime) {
					this._oData = {};
					if (jQuery.sap.getUriParameters().get("journey") === "Personalization") {
						jQuery.ajax("../localService/PersonalizationChanges.json", {
							async: false,
							success: function (oData) {
								this._oData.customData = oData;
							}.bind(this)
						});
					} else {
						this._oData.customData = this._oneTimeInitilzationOfAppState();
						this._oData.bSwitchedFromPersonalizationToVariant = undefined;
						this._bAppliedDefault = true;
					}
				}

				this._oGantt.setSelectionPanelSize(this._oData.customData.selectionPanelSize);

				this._deleteCustomDataObsoleteSince2308();
			},

			_deleteCustomDataObsoleteSince2308: function () {
				var aOutdatedProperties = ["sOrderLabelSettingFields", "sOperationLabelSettingFields", "sCurrentVariantKey", "oFilterData"];
				for (var sField in aOutdatedProperties) {
					if (this._oData.customData.hasOwnProperty(sField)) {
						delete this._oData.customData[sField];
					}
				}
			},

			get: function () {
				return this._oData.customData;
			},

			getSwitchedToVariant: function () {
				return this._oData.customData.bSwitchedFromPersonalizationToVariant ? this._oData.customData.bSwitchedFromPersonalizationToVariant : false;
			},

			change: function (sPropertyName, oValue) {
				var sPath = "/customData/" + sPropertyName;
				var oContainer = AppPersContainer.getInstance();
				oContainer.getFeatureModel(Constants.sGanttAppState).setProperty(sPath, oValue);
				oContainer.saveContainer();
			},

			save: function () {
				this._updateSizes();
				this._updatePeopleGanttDialogPersChanges();
				var oContainer = AppPersContainer.getInstance();
				oContainer.getFeatureModel(Constants.sGanttAppState).setProperty("/", {
					customData: this._oData.customData
				});
				oContainer.saveContainer();
			},

			_updateSizes: function () {
				this._oData.customData.selectionPanelSize = this._getSelectionPanelSizeAsPercentage();
				var sViewKey = this.controllers.ganttContainer.getViewKey();
				if (sViewKey === "OrdersAndResources") {
					this._oData.customData.splitterSize = this._getSplitterPositionAsPercentage();
				}
			},

			_updatePeopleGanttDialogPersChanges: function () {
				try {
					this.controllers.ordergantt.peopleGanttDialog.getFragmentSync();
				} catch (sError) {
					return;
				}				
				var oPeopleGanttPersChanges = this.controllers.ordergantt.peopleGanttDialog.getPersonalizationChanges();
				this._oData.customData.peopleGantt = oPeopleGanttPersChanges;
			},

			// before cleanup: SchedulingBoard.getSelectionPanelSizeAsPercentage
			_getSelectionPanelSizeAsPercentage: function () {
				var iContentWidth = this._oGantt.getContentWidth();
				var sSelectionPanelSize = this._oGantt.getSelectionPanelSize();
				var iFullContentSize, iSelectionPanelSize, sSelectionPanelSizeAsPercentage;
				if (iContentWidth && sSelectionPanelSize) {
					if (sSelectionPanelSize.includes("%")) {
						return sSelectionPanelSize;
					} else {
						iSelectionPanelSize = Number(sSelectionPanelSize.slice(0, -2));
						iFullContentSize = iContentWidth + iSelectionPanelSize;
						sSelectionPanelSizeAsPercentage = this._computePercentageValueForSplitter(iFullContentSize, iSelectionPanelSize);
						return sSelectionPanelSizeAsPercentage;
					}
				}
				return undefined;
			},

			// before cleanup: SchedulingBoard.getSplitterPositionAsPercentage
			_getSplitterPositionAsPercentage: function () {
				var aCalcSizes = this.byId("idOrderGanttContainer-ganttContainerSplitter").getCalculatedSizes();
				var iFullContentSize, sSplitterPosiAsPercentage;
				if (aCalcSizes && aCalcSizes.length > 0) {
					iFullContentSize = aCalcSizes[0] + aCalcSizes[1];
					sSplitterPosiAsPercentage = this._computePercentageValueForSplitter(iFullContentSize, aCalcSizes[0]);
					return sSplitterPosiAsPercentage;
				}
				return undefined;
			},

			// before cleanup: SchedulingBoard.computePercentageValueForSplitter
			_computePercentageValueForSplitter: function (iFullContentSize, iContentsectionSize) {
				var iPercentageValue, sPercentageValue;
				if (iFullContentSize && iContentsectionSize) {
					iPercentageValue = (iContentsectionSize / iFullContentSize) * 100;
					sPercentageValue = iPercentageValue.toFixed().toString().concat("%");
					return sPercentageValue;
				}
				return "30%";
			},

			// before cleanup: SchedulingBoard.onGanttVariantApplied
			switchToVariant: function () {
				this._applyToGanttSwitchAndSplitter();
				this._setGanttColumnPersonalization(this._oData);
				this._applyToSort();

				var bGanttVariantSaved;
				if (this._bAppliedDefault) {
					delete this._oData.customData.aVisibleColumns;
					delete this._oData.customData.aSortColumn;
					this._saveAfterSwitch();
					bGanttVariantSaved = false;
				} else {
					var bLocalRun = !!jQuery.sap.getUriParameters().get("sap-local-run");
					if (bLocalRun) {
						// Saving variant locally results in error and app does not work
						// So avoiding this in case of local run
						this.controllers.ganttContainer.showSelectedGantts();
						bGanttVariantSaved = false;
					} else {
						this._saveDefaultVariant();
						bGanttVariantSaved = true;

						delete this._oData.customData.aVisibleColumns;
						delete this._oData.customData.aSortColumn;
						delete this._oData.customData.sGanttSwitchSelectedKey;

						this._saveAfterSwitch();

						var oDialogUtil = new FilterInformationDialogUtil(
							this.getView(),
							Constants.sInfoToSwitchFromPersonalizationToVariant,
							"SwitchFromPersonalizationToVariantInfoMsg"
						);
						oDialogUtil.handleInfoDialogDynamicMsg(Constants.sDefaultVariant);
					}
				}

				return bGanttVariantSaved;
			},

			_saveDefaultVariant: function () {
				this.controllers.customVariant.initChanges();
				if (this._oData.customData && this._oData.customData.aVisibleColumns) {
					this._oData.customData.aVisibleColumns.forEach(
						function (oCol) {
							this.controllers.customVariant.updateProperty("/" + oCol.columnBindingName, oCol.width);
						}.bind(this)
					);
				}
				var sViewKey = this.controllers.ganttContainer.getViewKey();
				this.controllers.customVariant.updateProperty("/GanttViewState", sViewKey);
				this.controllers.customVariant.submitUpdates();
				setTimeout(
					function () {
						var oVariantManagement = this.controllers.ganttContainer.getVariantManagement();
						oVariantManagement.fireSave({
							name: this.oBundle.getText("defaultVariantName"),
							execute: true,
							public: false,
							def: true
						});
					}.bind(this),
					0
				);
			},

			// before cleanup: SchedulingBoard._saveAppStateToPersContainer
			_saveAfterSwitch: function () {
				this._oData.customData.bSwitchedFromPersonalizationToVariant = true;
				var oContainer = AppPersContainer.getInstance();
				oContainer.getFeatureModel(Constants.sGanttAppState).setProperty("/", this._oData);
				oContainer.saveContainer();
			},

			// before cleanup: SchedulingBoard._applyAppStateForGanttSwitchAndSplitter
			_applyToGanttSwitchAndSplitter: function () {
				var sGanttChartSwitchSelectedKey = this._oData.customData.sGanttSwitchSelectedKey ? this._oData.customData.sGanttSwitchSelectedKey : "Orders";
				this.controllers.ganttContainer.setViewKey(sGanttChartSwitchSelectedKey);
			},

			// before cleanup: SchedulingBoard._applySortPersChanges
			_applyToSort: function () {
				if (this._oData.customData.aSortColumn && this._oData.customData.aSortColumn.hasOwnProperty("id")) {
					var oSortColumn = this.byId(this._oData.customData.aSortColumn.id);
					if (oSortColumn) {
						this._oTable.fireSort({
							column: oSortColumn,
							sortOrder: this._oData.customData.aSortColumn.sortOrder,
							applicationEvent: true
						});
					}
				}
			}
		});
	}
);
