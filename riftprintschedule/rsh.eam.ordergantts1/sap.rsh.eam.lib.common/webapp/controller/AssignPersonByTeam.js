/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the Assign Person Popover fragment(AssignPerson.fragment.xml)
 * Hook methods of view life cycle can be imeplemented for fragment life cycle.
 * @name rsh.eam.lib.common.controller.AssignPerson
 */
sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/Fragment",
		"sap/rsh/eam/lib/common/utils/AppPersContainer",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Sorter",
		"sap/rsh/eam/lib/common/formatters/formatter",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (Controller, Fragment, AppPersContainer, Constants, Filter, FilterOperator, Sorter, Formatter, Utils) {
		"use strict";
		return Controller.extend("sap.rsh.eam.lib.common.controller.AssignPersonByTeam", {
			_sFragmentName: "sap.rsh.eam.lib.common.view.AssignPersonByTeam",
			formatter: Formatter,
			utils: Utils,

			/**
			 * Constructor for the Assign Dialog
			 * @param {Object} [oView] Parent view object
			 * @param {String} [sModelName] Name of the Parent Model
			 */
			constructor: function (oView, sModelName) {
				this._oParentView = oView;
				this._sParentModel = sModelName;
				this._oAssignDialogModel = this._oParentView.getModel(sModelName);

				this.sFragmentId = "idAsgRespPopoverFragDef";
				// Create a resource bundle for language specific texts
				this._oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});
				this._oReuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				this._oAssignDialogDataModel = new sap.ui.model.json.JSONModel({
					noDataText: ""
				});
			},

			formatPersonRespName: function (sPersonRespName, sPersRespId) {
				if (sPersonRespName && sPersRespId) {
					return "<strong>" + sPersonRespName + "</strong>" + " (" + sPersRespId + ")";
				}
				return "<strong>" + sPersonRespName + "</strong>";
			},

			formatWorkCenterPlant: function (sWorkCenter, sPlant) {
				if (this.bDiffPlantsAssigned && sWorkCenter) {
					return sWorkCenter + " / " + sPlant;
				} else {
					return sWorkCenter;
				}
			},

			/**
			 * Initializes and binds data model for the Assign Dialog
			 */
			initializeAssignDialogObjects: function () {
				this._oResourceList = Fragment.byId(this.sFragmentId, "idPersonByWorkCenterList");
				this._oHeaderLabel = Fragment.byId(this.sFragmentId, "idHeaderTextForResourceList");
				this._oCustomListItem = Fragment.byId(this.sFragmentId, "idPersRespItem");

				this._oAssignDialog.setModel(this._oResourceModel, "i18nLib");
				this._oAssignDialog.setModel(this._oAssignDialogModel, "AssignDialogModel");
				//This is used for storing the no data text for invisible text control based on the result list
				this._oAssignDialog.setModel(this._oAssignDialogDataModel, "AssignDialogDataModel");

				this._oResourceList.setShowNoData(false);

				// Set the app state for the dialog
				this._oAppStateData = AppPersContainer.getInstance().getFeatureModel(Constants.sAssignAppState).getData();
				this.bWorkCenterFilter = this._oAppStateData.bFilteredByWorkCenter;
				this.sQueryText = "";

				if (this._sParentModel === "assignModel") {
					// When assign dialog is called from the Test app, the app pers container
					// is not initialized. So initial values are set here.
					this.bWorkCenterFilter = true;
				}
			},

			/**
			 * Function to load the fragment and open the Assign dialog
			 * @param {Array} [aSelectedItems] Array of selected operations
			 * @param {Boolean} [bDiffPlants] Flag to check if work centers with different plants are assigned to user
			 */
			openDialog: function (aSelectedItems, bDiffPlantsAssigned) {
				var that = this;
				if (!this._oAssignDialog) {
					Fragment.load({
						id: this.sFragmentId,
						name: "sap.rsh.eam.lib.common.view.AssignPersonByTeam",
						controller: this
					}).then(function (oAssignDialog) {
						that._oAssignDialog = oAssignDialog;
						that._oParentView.addDependent(oAssignDialog);
						that._aSelectedOperations = aSelectedItems;
						that.bDiffPlantsAssigned = bDiffPlantsAssigned;
						that.initializeAssignDialogObjects();
						that.setInfoToolbarText();
						that.openDialogWithAppState();
					});
				} else {
					this._aSelectedOperations = aSelectedItems;
					this.bDiffPlantsAssigned = bDiffPlantsAssigned;
					this.setInfoToolbarText();
					this.openDialogWithAppState();
				}
			},

			/**
			 * Function that sets the text for infoBar according to the performing work center of the operation
			 */
			setInfoToolbarText: function () {
				var oInfoToolbarText = Fragment.byId(this.sFragmentId, "idWorkCenterFilterText");

				var aWorkCenters = [];
				this._aSelectedOperations.forEach(
					function (oItemData) {
						var oOperationData = oItemData.getBindingContext().getObject();
						var sPerformingWorkCenter = oOperationData.WorkCenter;
						if (this.bDiffPlantsAssigned) {
							sPerformingWorkCenter += " / " + oOperationData.Plant;
						}
						if (aWorkCenters.indexOf(sPerformingWorkCenter) === -1) {
							aWorkCenters.push(sPerformingWorkCenter);
						}
					}.bind(this)
				);
				var sWorkCenters = aWorkCenters.join(", ");

				var si18nKey = aWorkCenters.length === 1 ? "WorkCenterFilterText" : "WorkCentersFilterText";
				var sText = this._oReuseResourceBundle.getText(si18nKey, [sWorkCenters]);

				oInfoToolbarText.setText(sText);
				oInfoToolbarText.setTooltip(sText);
			},

			openDialogWithAppState: function () {
				this._oResourceList.removeAllItems();

				if (!this.bWorkCenterFilter) {
					this._oResourceList.setShowNoData(true);
					this.applyAppStateForNoWorkCenterFilter();
				} else {
					this.applyAppStateForWorkCenterFilter();
				}
				this._oAssignDialog.open();
			},

			applyAppStateForWorkCenterFilter: function () {
				var oInfoToolbar = Fragment.byId(this.sFragmentId, "infoToolbar");
				var oSearchField = Fragment.byId(this.sFragmentId, "idAssignPersSearchField");
				var oFilterButton = Fragment.byId(this.sFragmentId, "idFilterByWorkCenterButton");

				this.sQueryText = "";
				this.bWorkCenterFilter = true;
				oInfoToolbar.setVisible(true);
				oSearchField.setValue("");
				oSearchField.setPlaceholder(this._oReuseResourceBundle.getText("SearchFieldDefaultPlaceholderText"));
				oFilterButton.setIcon("sap-icon://clear-filter");
				oFilterButton.setTooltip(this._oReuseResourceBundle.getText("ClearFilterTooltip"));
				this._bindListItems(true);
			},

			applyAppStateForNoWorkCenterFilter: function () {
				var oInfoToolbar = Fragment.byId(this.sFragmentId, "infoToolbar");
				var oSearchField = Fragment.byId(this.sFragmentId, "idAssignPersSearchField");
				var oFilterButton = Fragment.byId(this.sFragmentId, "idFilterByWorkCenterButton");
				var iResourcesCount = this._oResourceList.getItems().length;

				this.bWorkCenterFilter = false;
				this.sQueryText = "";
				oFilterButton.setIcon("sap-icon://filter");
				oInfoToolbar.setVisible(false);
				oSearchField.setValue("");
				oSearchField.setPlaceholder(this._oReuseResourceBundle.getText("SearchFieldPlaceholderText"));
				oFilterButton.setTooltip(this._oReuseResourceBundle.getText("ApplyFilterTooltip"));
				this._oResourceList.unbindItems();
				this._oResourceList.setNoDataText(this._oReuseResourceBundle.getText("SearchPeopleHeaderText"));
				//update the no data text for InvisibleText control based on the result list
				this.updateNoDataTextInModel(iResourcesCount, this._oReuseResourceBundle.getText("SearchPeopleHeaderText"));
				this._oHeaderLabel.setVisible(false);
			},

			/**
			 * Handles the press event of the Dialog's Cancel button.
			 * * @public
			 */
			closeDialog: function () {
				this.sQueryText = "";
				var oSearchField = Fragment.byId(this.sFragmentId, "idAssignPersSearchField");
				oSearchField.setValue("");

				this._oAssignDialog.close();
			},

			saveAppState: function () {
				var oAssignDialogPersModel = AppPersContainer.getInstance().getFeatureModel(Constants.sAssignAppState);
				oAssignDialogPersModel.setProperty("/bFilteredByWorkCenter", this.bWorkCenterFilter);
				AppPersContainer.getInstance().saveContainer();
			},

			onItemSelect: function (oControlEvent) {
				var oItemObject = oControlEvent.getParameters().listItem.getBindingContext("AssignDialogModel").getObject();
				var sOperationPersonResponsibleID = oItemObject.OperationPersonResponsibleID;
				var oReturnObj = {};
				oReturnObj.OperationPersonResponsibleID = sOperationPersonResponsibleID;
				sap.ui.getCore().getEventBus().publish(Constants.sLibraryChannel, Constants.sAssignWrkCenterPersonResp, oReturnObj);
			},

			onClearFilter: function (oControlEvent) {
				this.applyAppStateForNoWorkCenterFilter();
			},

			onFilterPress: function (oEvent) {
				if (this.bWorkCenterFilter) {
					// When searching for all people without filter
					this.applyAppStateForNoWorkCenterFilter();
				} else {
					this.applyAppStateForWorkCenterFilter();
				}
			},

			onSearch: function (oControlEvent) {
				var sQuery = oControlEvent.getParameters().query;
				this.sQueryText = sQuery;
				if (this.bWorkCenterFilter) {
					this._bindListItems(true);
				} else {
					if (sQuery) {
						this._bindListItems(false);
					} else {
						this.applyAppStateForNoWorkCenterFilter();
					}
				}
			},

			onListUpdateFinish: function (oControlEvent) {
				var iResourceCount = oControlEvent.getParameters().total;
				if (!iResourceCount) {
					this._oHeaderLabel.setVisible(false);
				}
				this._oHeaderLabel.setText(this._oReuseResourceBundle.getText("ResourceCountText", [iResourceCount]));
				oControlEvent.getSource().setShowNoData(true);
				if (!this.sQueryText && this.bWorkCenterFilter) {
					oControlEvent.getSource().setNoDataText(this._oReuseResourceBundle.getText("AssignDialogNoDataText"));
					//set no data text for invisible text control based on the result list count
					this.updateNoDataTextInModel(iResourceCount, this._oReuseResourceBundle.getText("AssignDialogNoDataText"));
				} else {
					oControlEvent.getSource().setNoDataText(this._oReuseResourceBundle.getText("DefaultNoDataText"));
					//set no data text for invisible text control based on the result list count
					this.updateNoDataTextInModel(iResourceCount, this._oReuseResourceBundle.getText("DefaultNoDataText"));
				}
			},

			onListUpdateStart: function (oControlEvent) {
				oControlEvent.getSource().setShowNoData(false);
				this._oHeaderLabel.setVisible(true);
				this._oHeaderLabel.setText();
			},

			/**
			 * Binds the list items according to the filters and the query string
			 * @param {boolean} [bFilterByWorkCenter] If Work Center Filter should be applied
			 */
			_bindListItems: function (bFilterByWorkCenter) {
				var that = this;
				var oSorter = new Sorter({
					path: "OperationPersonRespName",
					descending: false
				});

				var oFilter;

				if (bFilterByWorkCenter) {
					oFilter = this.getFilters()[0];
				}

				var oAggregationBindingInfo = {
					path: "/C_RSHWrkCtrPersonResponsibleVH",
					model: "AssignDialogModel",
					template: that._oCustomListItem,
					templateShareable: true,
					filters: oFilter,
					parameters: {
						custom: {
							search: that.sQueryText,
							"search-focus": "OperationPersonRespName"
						}
					},
					sorter: oSorter
				};

				// Removing the sorter when a search term is entered
				if (this.sQueryText.length) {
					delete oAggregationBindingInfo.sorter;
				}

				this._oResourceList.bindAggregation("items", oAggregationBindingInfo);
			},

			getFilters: function () {
				var aWorkCenterIdsFilter = [],
					aWorkCenterIds = [],
					aFilters = [];

				this._aSelectedOperations.forEach(function (oItemData) {
					var sPerformingWorkCenter = oItemData.getBindingContext().getObject().WorkCenterInternalID;
					// Do not create duplicate filters
					if (!aWorkCenterIds.includes(sPerformingWorkCenter)) {
						var oWorkCenterInternalIdFilter = new Filter("WorkCenterInternalID", FilterOperator.EQ, sPerformingWorkCenter);
						aWorkCenterIdsFilter.push(oWorkCenterInternalIdFilter);
					}
					aWorkCenterIds.push(sPerformingWorkCenter);
				});

				var oWorkCenterFilter = new Filter({
					filters: aWorkCenterIdsFilter,
					and: false
				});

				aFilters = [oWorkCenterFilter];

				return aFilters;
			},

			cleanUp: function () {
				// Destroying the template manually since templateSharable is set to true for the list binding
				Fragment.byId(this.sFragmentId, "idPersRespItem").destroy();
			},

			updateNoDataTextInModel: function (iResourceCount, sNoDataText) {
				if (iResourceCount === 0) {
					this._oAssignDialog.getModel("AssignDialogDataModel").setProperty("/noDataText", sNoDataText);
				} else {
					this._oAssignDialog.getModel("AssignDialogDataModel").setProperty("/noDataText", "");
				}
			}
		});
	}
);
