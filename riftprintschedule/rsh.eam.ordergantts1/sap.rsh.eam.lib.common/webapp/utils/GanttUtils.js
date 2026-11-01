/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/format/DateFormat", "sap/rsh/eam/lib/common/utils/utils", "sap/ui/core/date/UI5Date"], function (DateFormat, Utils, UI5Date) {
	"use strict";

	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");

	var oGanttUtils;

	oGanttUtils = {
		/*COLORGREEN: 30,
		COLORYELLOW: 20,
		COLORNONE: 40,
		COLORNEUTRAL: 10,
		DISPATCHED: 30,
		DUE: 20,*/

		//should not be necessary once all apps are adjusted and should be cleaned up
		removeTimeZoneOffset: function (dTime) {
			if (dTime) {
				return new Date(dTime.getTime() + dTime.getTimezoneOffset() * 60 * 1000);
			} else {
				return undefined;
			}
		},

		//should not be necessary once all apps are adjusted and should be cleaned up
		addTimeZoneOffset: function (dTime) {
			if (dTime) {
				return new Date(dTime.getTime() - dTime.getTimezoneOffset() * 60 * 1000);
			} else {
				return undefined;
			}
		},

		/**
		 * Formatter method for adding end time to calendar date
		 * @public
		 * @param {Date} [dCalendarDate] Calendar Date
		 * @returns {Date} formatted date
		 */
		formatEndTime: function (dCalendarDate) {
			if (dCalendarDate) {
				var oDate = dCalendarDate;
				oDate.setHours(23, 59, 59, 999);
				return oDate;
			}
			return null;
		},

		/**
		 * Formatter method for adding initial time to calendar date
		 * @public
		 * @param {Date} [dCalendarDate] Calendar Date
		 * @returns {Date} formatted date
		 */
		formatStartTime: function (dCalendarDate) {
			if (dCalendarDate) {
				var oDate = dCalendarDate;
				oDate.setHours(0, 0, 0, 0);
				return oDate;
			}
			return null;
		},

		/**
		 * returns the color code by processing status
		 * @param {string} sType processing status
		 * @returns {color} color code
		 */
		getColor: function (sType) {
			switch (sType) {
				case 30:
					//green color
					return "@sapPositiveColor";
				case 20:
					//yellow color
					return "@sapCriticalColor";
				case "REQ_SHUTDOWN":
					return "@sapNegativeColor";
				case "UNDER_MAINT":
					return "sapUiLegend6";
				default:
					//gray color
					return "@sapNeutralColor";
			}
		},

		/*
		 * @public
		 * returns the icon by Object Type
		 * @param {oRowObjType} objectType
		 * @returns {Icon} for Gantt tree table rows
		 */
		getImageObject: function (oRowObjType) {
			switch (oRowObjType) {
				case "4_FLOC":
					return "sap-icon://functional-location";
				case "3_EQUI":
					return "sap-icon://technical-object";
				case "1_ORDER":
					return "sap-icon://chevron-phase-2";
				case "2_MPLAN":
					return "sap-icon://checklist-item-2";
				case "MPLAN_OPEN_CALL":
					return "sap-icon://circle-task-2";
				default:
					return null;
			}
		},

		/**
		 * @public
		 * returns the height by shape type
		 * @param {string} sShapeType shape type
		 * @returns {height} height
		 */
		getHeight: function (sShapeType) {
			switch (sShapeType) {
				case "REQ_SHUTDOWN":
					return 20;
				case "UNDER_MAINT":
					return 10;
				case "ORDER":
					return 20;
				case "MPLAN_ORDER":
					return 20;
				case "MPLAN_OPEN_CALL":
					return 20;
				default:
					return 0;
			}
		},

		getTitle: function (dStartDateTime, dEndDatetime) {
			if (dStartDateTime !== null && dEndDatetime !== null) {
				return oGanttUtils._formatToLocale(dStartDateTime) + "-" + oGanttUtils._formatToLocale(dEndDatetime);
			}
			return "";
		},

		getActualDatesTooltip: function (sActualWork1, sRemainingWork1) {
			if (sActualWork1 !== null && sRemainingWork1 !== null) {
				var sActualWork = Number(sActualWork1).toFixed(1);
				var sRemainingWork = Number(sRemainingWork1).toFixed(1);

				return oResourceBundle.getText("ActualWorkTooltip", [sActualWork, sRemainingWork]);
			}
			return "";
		},

		_formatToLocale: function (dDateTime) {
			if (!oGanttUtils._oDateFormatter) {
				oGanttUtils._oDateFormatter = DateFormat.getDateTimeInstance({
					locale: sap.ui.getCore().getConfiguration().getLocale()
				});
			}
			if (dDateTime) {
				return oGanttUtils._oDateFormatter.format(dDateTime);
			} else {
				return dDateTime;
			}
		},

		getColumnPersonalization: function (oTreeTable, oGanttChartwithTable) {
			var oColumns = oTreeTable.getColumns();
			var aVisibleColumns = [];
			var oAppState = {};
			var aSortColumn = {};
			for (var i = 0; i < oColumns.length; i++) {
				if (oColumns[i].getVisible()) {
					aVisibleColumns.push({
						pos: i,
						width: oColumns[i].getWidth(),
						columnBindingName: oColumns[i].getSortProperty()
					});
				}
				if (oColumns[i].getSorted()) {
					aSortColumn.pos = i;
					aSortColumn.sortOrder = oColumns[i].getSortOrder();
					aSortColumn.sortProperty = oColumns[i].getSortProperty();
					aSortColumn.id = oColumns[i].getId();
				}
			}
			oAppState.aVisibleColumns = aVisibleColumns;
			oAppState.aSortColumn = aSortColumn;
			oAppState.selectionPanelSize = oGanttChartwithTable.getSelectionPanelSize();
			return oAppState;
		},

		setColumnPersonalization: function (oSavedAppState, oTreeTable, oGanttChartwithTable) {
			if (oSavedAppState && oSavedAppState && Object.keys(oSavedAppState).length !== 0) {
				if (oSavedAppState.customData.aVisibleColumns) {
					var oColumns = oTreeTable.getColumns();
					var oColumnData;
					var i;
					for (i = 1; i < oColumns.length; i++) {
						oColumns[i].setVisible(false);
					}
					for (i = 0; i < oSavedAppState.customData.aVisibleColumns.length; i++) {
						oColumnData = oSavedAppState.customData.aVisibleColumns[i];
						if (oColumns[oColumnData.pos]) {
							oColumns[oColumnData.pos].setVisible(true);
							oColumns[oColumnData.pos].setWidth(oColumnData.width);
						}
					}
				}
				oGanttChartwithTable.setSelectionPanelSize(oSavedAppState.customData.selectionPanelSize);
			}
		},

		/**
		 * Function stores initial state of the Gantt for properties column width and applied sort property for visible columns and Panel size
		 * in case there is no app state stored
		 * @public
		 * @param {Object} [oTreeTable] Tree table instance
		 * @param {Object} [oGanttChartwithTable] Gantt chart instance
		 * @returns {Object} [oAppState] Initial App State
		 *
		 */
		// TODO delete after all apps use PersAppState controller
		oneTimeInitilzationOfAppState: function (oTreeTable, oGanttChartwithTable) {
			var oColumns = oTreeTable.getColumns();
			var aVisibleColumns = [];
			var oAppState = {};
			var aSortColumn = {};
			for (var i = 0; i < oColumns.length; i++) {
				if (oColumns[i].getVisible()) {
					aVisibleColumns.push({
						width: oColumns[i].getWidth(),
						columnBindingName: oColumns[i].getSortProperty(),
						id: this.getControlId(oColumns[i].getId())
					});
				}
				if (oColumns[i].getSorted()) {
					aSortColumn.sortOrder = oColumns[i].getSortOrder();
					aSortColumn.sortProperty = oColumns[i].getSortProperty();
					aSortColumn.id = this.getControlId(oColumns[i].getId());
				}
			}

			oAppState.aVisibleColumns = aVisibleColumns;
			oAppState.aSortColumn = aSortColumn;
			oAppState.selectionPanelSize = oGanttChartwithTable.getSelectionPanelSize();
			return oAppState;
		},

		/**
		 * Function updates app state of the Gantt for properties column width and applied sort property for visible columns and Panel size
		 * in case there is any event triggered for changing these properties and returns this app state to the callee.
		 * @public
		 * @param {Object} [oTreeTable] Tree table instance
		 * @param {Object} [oGanttChartwithTable] Gantt Chart instance
		 * @param {Object} [oEvent] Change event
		 * @param {Object} [oAppState] Existing app state
		 * @returns {Object} [oUpdatedAppState] Updated app state
		 */
		// TODO delete after all apps use PersAppState controller
		getGanttColumnPersonalization: function (oTreeTable, oGanttChartwithTable, oEvent, oAppState) {
			var aVisibleColumns = [];
			var oUpdatedAppState = {};
			var aSortColumn = {};

			if (oEvent) {
				//Get existing app state values
				if (oAppState && oAppState.customData) {
					if (oAppState.customData.aVisibleColumns && oAppState.customData.aVisibleColumns.length) {
						aVisibleColumns = oAppState.customData.aVisibleColumns;
					}
					if (oAppState.customData.aSortColumn && oAppState.customData.aSortColumn.sortOrder) {
						aSortColumn.sortOrder = oAppState.customData.aSortColumn.sortOrder;
						aSortColumn.sortProperty = oAppState.customData.aSortColumn.sortProperty;
						aSortColumn.id = oAppState.customData.aSortColumn.id;
					}
				}
				var sEventId = oEvent.getId();
				var oChangedColumn = oEvent.getParameter("column");
				var __findIndex = -1;

				if (sEventId === "columnResize") {
					__findIndex = this.findIndexOfElementInArray(aVisibleColumns, oChangedColumn);
					if (__findIndex >= 0) {
						//Store the width for the visible column
						aVisibleColumns[__findIndex].width = oEvent.getParameter("width");
					}
				} else if (sEventId === "sort") {
					//Store the sort property
					aSortColumn.sortOrder = oEvent.getParameter("sortOrder");
					aSortColumn.sortProperty = oChangedColumn.getSortProperty();
					aSortColumn.id = this.getControlId(oChangedColumn.getId());
				} else if (sEventId === "columnVisibility") {
					if (oEvent.getParameter("newVisible")) {
						//Add the column
						aVisibleColumns.push({
							width: oChangedColumn.getWidth(),
							columnBindingName: oChangedColumn.getSortProperty(),
							id: this.getControlId(oChangedColumn.getId())
						});
					} else {
						__findIndex = this.findIndexOfElementInArray(aVisibleColumns, oChangedColumn);
						//Remove the column
						if (__findIndex >= 0) {
							aVisibleColumns.splice(__findIndex, 1);
						}
						//Check if the column's sort property is same as app state sort property and remove.
						if (
							oEvent.getSource().getId().indexOf("WorkCenterUtilization-displayGantt") === -1 &&
							oChangedColumn.getSortProperty() === aSortColumn.sortProperty
						) {
							aSortColumn.sortOrder = "";
							aSortColumn.sortProperty = "";
							aSortColumn.id = "";
						}
					}
				}
			}
			oUpdatedAppState.aVisibleColumns = aVisibleColumns;
			oUpdatedAppState.aSortColumn = aSortColumn;
			oUpdatedAppState.selectionPanelSize = oGanttChartwithTable.getSelectionPanelSize();
			return oUpdatedAppState;
		},

		/**
		 * Property width and visibilty are directly set for visible fields,
		 * Panel size is set,
		 * using existing app state in subject view
		 * @public
		 * @param {Object} [oSavedAppState] Saved app state
		 * @param {Object} [oTreeTable] tree table instance
		 * @param {Object} [oGanttChartwithTable] Gantt Chart instance
		 * @param {Object} [oAppController] controller of subject App
		 */
		// TODO delete after all apps use PersAppState controller
		setGanttColumnPersonalization: function (oSavedAppState, oTreeTable, oGanttChartwithTable, oAppController) {
			if (oSavedAppState && oSavedAppState && Object.keys(oSavedAppState).length !== 0) {
				if (oSavedAppState.customData.aVisibleColumns) {
					var oColumns = oTreeTable.getColumns();
					var oColumnData,
						aColsToSetVisibility = [];
					var i;
					for (i = 1; i < oColumns.length; i++) {
						oColumns[i].setVisible(false);
					}
					for (i = 0; i < oSavedAppState.customData.aVisibleColumns.length; i++) {
						oColumnData = oAppController.getView().byId(oSavedAppState.customData.aVisibleColumns[i].id);
						if (oColumnData) {
							oColumnData.setVisible(true);
							oColumnData.setWidth(oSavedAppState.customData.aVisibleColumns[i].width);
						} else {
							var oColumnAdaption = oAppController.controllers && oAppController.controllers.columnAdaption;
							var bHasAdaptedColumns = oColumnAdaption ? oColumnAdaption.isAdapted() : false;
							if (bHasAdaptedColumns) {
								// Instances of dynamically added columns do not exist in the AppContext view
								// Identify all such columns from the oSavedAppState
								// Finally set the visibility fetching the column instance directly from the table control
								aColsToSetVisibility.push(oSavedAppState.customData.aVisibleColumns[i].id);
							}
						}
					}
					if (aColsToSetVisibility.length > 0) {
						for (i = 1; i < oColumns.length; i++) {
							if (aColsToSetVisibility.includes("id" + oColumns[i].getSortProperty())) {
								oColumns[i].setVisible(true);
							}
						}
					}
				}
				oGanttChartwithTable.setSelectionPanelSize(oSavedAppState.customData.selectionPanelSize);
			}
		},

		/** Formatter to determine the rectangle shape hight
		 * depending on condensed mode is on/off
		 * @public
		 * @param {Integer} [iOrderOperationRowLevel] Order Operation Row Level
		 * @param {Boolean} [bCondensedModeActive] Condensed Mode Active
		 * @return {Integer} Rectangle Hight
		 **/
		getRectangleHight: function (iOrderOperationRowLevel, bCondensedModeActive) {
			if (iOrderOperationRowLevel === 1 && bCondensedModeActive) {
				return 12;
			} else if (iOrderOperationRowLevel === 1 && bCondensedModeActive === false) {
				return 20;
			} else {
				return 0;
			}
		},

		/** Formatter to determine the shevron shape hight
		 * depending on condensed mode is on/off
		 * @public
		 * @param {Integer} [iOrderOperationRowLevel] Order Operation Row Level
		 * @param {Boolean} [bCondensedModeActive] Condensed Mode Active
		 * @return {Integer} Shevron Hight
		 **/
		getShevronHight: function (iOrderOperationRowLevel, bCondensedModeActive) {
			if (iOrderOperationRowLevel === 0 && bCondensedModeActive) {
				return 12;
			} else if (iOrderOperationRowLevel === 0 && bCondensedModeActive === false) {
				return 20;
			} else {
				return 0;
			}
		},

		/** Formatter to determine the shevron shape head width
		 * depending on condensed mode is on/off
		 * @public
		 * @param {Boolean} [bCondensedModeActive] Condensed Mode Active
		 * @return {Integer} Shevron head width
		 **/
		getShevronHeadWidth: function (bCondensedModeActive) {
			if (bCondensedModeActive) {
				return 6;
			} else {
				return 10;
			}
		},

		/** Formatter to determine the shevron shape head width
		 * depending on condensed mode is on/off
		 * @public
		 * @param {Boolean} [bCondensedModeActive] Condensed Mode Active
		 * @return {Integer} Shevron head width
		 **/
		getShevronTailWidth: function (bCondensedModeActive) {
			if (bCondensedModeActive) {
				return 6;
			} else {
				return 10;
			}
		},

		/**
		 *
		 * @param {String} [sControlId] Complete ID
		 * @returns {String} [sControlId] extracted the ID from complete ID
		 */
		getControlId: function (sControlId) {
			var sExtControlId = sControlId;
			if (sExtControlId) {
				sExtControlId = sExtControlId.split("--") ? sExtControlId.split("--")[sExtControlId.split("--").length - 1] : "";
			}
			return sExtControlId;
		},

		/**
		 *
		 * @param {Array} [aArray] Array to be searched
		 * @param {Object} [oItem] Item to be matched
		 * @returns {Integer} index
		 */
		findIndexOfElementInArray: function (aArray, oItem) {
			var sColumnId = this.getControlId(oItem.getId());
			if (sColumnId !== "") {
				for (var i = 0; i < aArray.length; i++) {
					if (aArray[i].id === sColumnId) {
						return i;
					}
				}
			}
			return -1;
		},

		/** Formatter to determine the label text for operation bar
		 * @public
		 * @param {String} [sWorkCenter] Man Work Center
		 * @param {String} [iCapacities] #Capacities
		 * @param {String} [sOpDesc] Operation Description
		 * @param {String} [sPersonResponsible] Name of Person Responsible
		 * @param {String} [dPlannedTime] Operation Start/End time
		 * @param {String} [sOperationId] Operation ID
		 * @param {String} [sMaintenanceOrderSubOperation] Maintenance Order SubOperation
		 * @param {String} [sExecutionStage] Maintenance Operation Execution Stage
		 * @param {String} [sSelectedLabelKey] Key of the label selected in label settings
		 * @param {Boolean} [bToggleBtnOn] State of the Toggle Button for Labels
		 * @param {String} [sMainWorkCenterPlant] Plant of maintenance work center
		 * @param {String} [sAssignedPeopleCount] Number of Assigned People for the operation*
		 * @param {String} [sAssignedPeople] Concatenated Assign people for the operation
		 * @return {String} Label Text
		 **/
		getOpLabelText: function (
			sWorkCenter,
			iCapacities,
			sOpDesc,
			sPersonResponsible,
			dPlannedTime,
			sOperationId,
			sMaintenanceOrderSubOperation,
			sExecutionStage,
			sSelectedLabelKey,
			bToggleBtnOn,
			sMainWorkCenterPlant,
			sAssignedPeopleCount,
			sAssignedPeople
		) {
			if (bToggleBtnOn !== undefined && !bToggleBtnOn) {
				return "";
			}

			var sSelectedLabel = sSelectedLabelKey.split("-")[0];
			switch (sSelectedLabel) {
				case "PerformingWorkCenter":
					return sWorkCenter;
				case "NumberOfCapacities":
					if (iCapacities > 1) {
						return oResourceBundle.getText("Resources", iCapacities);
					} else if (iCapacities === 0 || iCapacities === 1) {
						return oResourceBundle.getText("Resource", iCapacities.toString());
					}
					return iCapacities;
				case "OperationDescription":
					return sOpDesc;
				case "OperationPersonRespName":
					return sPersonResponsible;
				case "OrderOperationStartDateTime":
					return oGanttUtils._formatToLocale(dPlannedTime);
				case "OrderOperationEndDateTime":
					return oGanttUtils._formatToLocale(dPlannedTime);
				case "OrderOperationStartTime":
					return dPlannedTime ? DateFormat.getTimeInstance().format(dPlannedTime) : dPlannedTime;
				case "OrderOperationEndTime":
					return dPlannedTime ? DateFormat.getTimeInstance().format(dPlannedTime) : dPlannedTime;
				case "MaintenanceOrderOperationIdDesc":
					if (sMaintenanceOrderSubOperation && sMaintenanceOrderSubOperation !== "") {
						return oResourceBundle.getText("OpSubOpIdAndDesc", [sOperationId, sMaintenanceOrderSubOperation, sOpDesc]);
					} else {
						return oResourceBundle.getText("OpIdAndDesc", [sOperationId, sOpDesc]);
					}
				case "MaintOpExecutionStageName":
					return sExecutionStage;
				case "NumberOfAssignedPersons":
					return oResourceBundle.getText("AssignedPeople", [sAssignedPeopleCount, iCapacities]);
				case "MainWorkCenterPlant":
					return oResourceBundle.getText("CombinedWorkCenterPlantTemplate", [sWorkCenter, sMainWorkCenterPlant]);
				case "ConcatenatedAssignedPersonsTxt":
					return sAssignedPeople;
				default:
					return "";
			}
		},

		getTitleFontColor: function (status) {
			switch (status) {
				case 30: // Dispatched (green)
					return "@sapList_FooterBackground"; // White in Quarz light and Black in Quarz dark
				default:
					return "@sapTextColor";
			}
		},

		/** Formatter to determine the label text for order bar
		 * @public
		 * @param {String} [sWorkCenter] Main Work Center
		 * @param {String} [sOrderDesc] Order Description
		 * @param {String} [sOrderType] Order Type
		 * @param {String} [sPriority] Priority
		 * @param {String} [dOrderBasicDateTime] Order Basic Start/End Date Time
		 * @param {String} [sOrderId] Order ID
		 * @param {String} [sMaintEvent] Maintenance Event
		 * @param {String} [sSelectedLabelKey] Key of the label selected in label settings
		 * @param {Boolean} [bToggleBtnOn] State of the Toggle Button for Labels
		 * @param {String} [sMainWorkCenterPlant] Plant of Maintenance work center
		 * @return {String} Label Text
		 **/
		getOrderLabelText: function (
			sWorkCenter,
			sOrderDesc,
			sOrderType,
			sPriority,
			dOrderBasicDateTime,
			sOrderId,
			sMaintEvent,
			sSelectedLabelKey,
			bToggleBtnOn,
			sMainWorkCenterPlant
		) {
			if (bToggleBtnOn !== undefined && !bToggleBtnOn) {
				return "";
			}

			var sSelectedLabel = sSelectedLabelKey.split("-")[0];
			switch (sSelectedLabel) {
				case "WorkCenter":
				case "MainWorkCenter":
					return sWorkCenter;
				case "MaintenanceOrderDesc":
					return sOrderDesc;
				case "OrderType":
				case "MaintenanceOrderType":
					return sOrderType;
				case "MaintPriorityDesc":
					return sPriority;
				case "OrderStartDateTime":
					return oGanttUtils._formatToLocale(dOrderBasicDateTime);
				case "OrderEndDateTime":
					return oGanttUtils._formatToLocale(dOrderBasicDateTime);
				case "OrderStartTime":
					return dOrderBasicDateTime ? DateFormat.getTimeInstance().format(dOrderBasicDateTime) : dOrderBasicDateTime;
				case "OrderEndTime":
					return dOrderBasicDateTime ? DateFormat.getTimeInstance().format(dOrderBasicDateTime) : dOrderBasicDateTime;
				case "MaintenanceOrderIdDesc":
					return oResourceBundle.getText("OrderIdAndDesc", [sOrderId, sOrderDesc]);
				case "MaintenanceRevision":
					return sMaintEvent;
				case "MainWorkCenterPlant":
					return oResourceBundle.getText("CombinedWorkCenterPlantTemplate", [sWorkCenter, sMainWorkCenterPlant]);
				default:
					return "";
			}
		},

		/** Formatter to determine the label text for Maintenance Event
		 * @public
		 * @param {String} [sMaintEvent] Maintenence Event
		 * @param {String} [sMaintEventText] Maintenence Event Desc
		 * @param {String} [sBucket] Maintenence Plan Bucket
		 * @param {String} [sBucketDesc] Maintenence Plan Bucket Desc
		 * @param {String} [sPersonResp] Person Resp
		 * @param {String} [dMaintEventDateTime] Maintenence Event Start/End Time
		 * @param {String} [sSelectedLabelKey] Key of the label selected in label settings
		 * @return {String} Label Text
		 **/
		getMaintEventLabelText: function (sMaintEvent, sMaintEventText, sBucket, sBucketDesc, sPersonResp, dMaintEventDateTime, sSelectedLabelKey) {
			var sSelectedLabel = sSelectedLabelKey.split("-")[0];
			switch (sSelectedLabel) {
				case "MaintenanceRevision":
					return sMaintEvent;
				case "MaintenanceEventText":
					return sMaintEventText;
				case "MaintPlngBucketLabel":
					return sBucket;
				case "MaintPlanningBucketDescription":
					return sBucketDesc;
				case "PersonResponsibe":
					return sPersonResp;
				case "MaintAssetBoardShapeStrtDteTme":
					return oGanttUtils._formatToLocale(dMaintEventDateTime);
				case "MaintAssetBoardShapeEndDteTme":
					return oGanttUtils._formatToLocale(dMaintEventDateTime);
				case "MaintAssetBoardShapeStrtTme":
					return dMaintEventDateTime ? DateFormat.getTimeInstance().format(dMaintEventDateTime) : dMaintEventDateTime;
				case "MaintAssetBoardShapeEndTme":
					return dMaintEventDateTime ? DateFormat.getTimeInstance().format(dMaintEventDateTime) : dMaintEventDateTime;
				default:
					return "";
			}
		},

		/** Formatter to determine the tooltip for Order/Operation bar
		 * @public
		 * @param {String} [dStartTime] Start Date Time
		 * @param {String} [dEndTime] End Date Time
		 * @param {String} [sSelectedLabelKey] Key of the label selected in label settings
		 * @param {Boolean} [bToggleBtnOn] State of the Toggle Button for Labels
		 * @return {String} Tooltip
		 **/
		getTooltip: function (dStartTime, dEndTime, sSelectedLabelKey, bToggleBtnOn) {
			var sSelectedLabel = sSelectedLabelKey.split("-")[0];
			if (!bToggleBtnOn || sSelectedLabel === "NoLabel") {
				return oGanttUtils.getTitle(dStartTime, dEndTime);
			}
			return "";
		},

		/** Formatter to determine the tooltip for quick toggle buttons
		 * @public
		 * @param {Boolean} [bToggleBtnOn] State of toggle button
		 * @param {String} [sTooltipOnOn] Tooltip to be shown when ON
		 * @param {String} [sTooltipOnOff] Tooltip to be shown when OFF
		 * @return {String} Tooltip for toggle button
		 **/
		getTooltipForToggleBtn: function (bToggleBtnOn, sTooltipOnOn, sTooltipOnOff) {
			if (bToggleBtnOn) {
				return sTooltipOnOn;
			}
			return sTooltipOnOff;
		},

		/**
		 * Handler for Full Screen toggle button on Gantt Tree Table Toolbar
		 * @param {Object} [oGantt] GanttChartWithTable Object
		 * @param {Boolean} [bShowToolbar] Whether Toolbar is visible
		 * @param {Object} [oButton] FullScreen Button Object
		 */
		onToggleFullScreen: function (oGantt, bShowToolbar, oButton) {
			oGantt.toggleFullScreen(bShowToolbar, oButton);
			if (oGantt.fullScreenMode()) {
				oButton.setIcon("sap-icon://exit-full-screen");
			} else {
				oButton.setIcon("sap-icon://full-screen");
			}
		},

		/**
		 * Formatter to add suffix for MaintAssetBoardRowObjID
		 * so that there won't be duplicates for shutdown order(BaseCheveron and Base Rectangle)
		 * @param {Object} [sMaintAssetBoardRowObjID] MaintAssetBoardRowObjID
		 */
		suffixMaintAssetBoardRowObjID: function (sMaintAssetBoardRowObjID) {
			if (sMaintAssetBoardRowObjID) {
				return sMaintAssetBoardRowObjID + "_shutdown";
			} else {
				return sMaintAssetBoardRowObjID;
			}
		},

		setStatusBarDateTimeFormat: function (oGanttChartContainer) {
			var oFioriFormatSettings = sap.ui.getCore().getConfiguration().getFormatSettings();
			var sLocaleTimePattern = oFioriFormatSettings.getTimePattern("medium");
			var sLocaleDatePattern = oFioriFormatSettings.getDatePattern("medium");

			oGanttChartContainer.setStatusBarDatePattern(sLocaleDatePattern);
			oGanttChartContainer.setStatusBarTimePattern(sLocaleTimePattern);
		},
		
		//Returns date as YYMMDDhhmmss string as needed by gantt e.g for timeline and time interval
		getDateInGanttFormat: function (dDate){
			var dDateToFormat = dDate;
			if (dDate instanceof Date && !(dDate instanceof UI5Date)){
				//this conversion is only needed when the function is used as direct formatter of binding e.g for time interval of calendar
				dDateToFormat = UI5Date.getInstance(dDate);
			}
			var sYear = dDateToFormat.getFullYear().toString();
			var sMonth = Utils.addPadding(String(dDateToFormat.getMonth() + 1), 2);
			var sDay = Utils.addPadding(String(dDateToFormat.getDate()), 2);
			var sHours = Utils.addPadding(String(dDateToFormat.getHours()), 2);
			var sMinutes = Utils.addPadding(String(dDateToFormat.getMinutes()), 2);
			var sSeconds = Utils.addPadding(String(dDateToFormat.getSeconds()), 2);
			return sYear + sMonth + sDay + sHours + sMinutes + sSeconds;
		},
					
		getUI5DateFromDropCursorDateTime: function (dCursorDateTime){
			// cursorDateTime is normal JS but has hours, minutes, .. adjusted to FLP timezone and can't be used directly 
			// Need to be converted to UI5Date with the exact values the JS Date has
			return UI5Date.getInstance(dCursorDateTime.getFullYear(), dCursorDateTime.getMonth(), dCursorDateTime.getDate(), dCursorDateTime.getHours(), dCursorDateTime.getMinutes(), dCursorDateTime.getSeconds(),0);
		},
		
		getFinalDueDateStartTime: function (dDate){
		//Using as formatter for final due date. It is edm.DateTime with contraint Date only but the shape needs a date object for start time
		//The UTC values for year, month and day are giving the actual day that we want to see in the gantt with start of the day
			var dFinalDueDate = null;
			if (dDate){
				var iYear = dDate.getUTCFullYear();
				var iMonth = dDate.getUTCMonth();
				var iDate = dDate.getUTCDate();
				dFinalDueDate = UI5Date.getInstance(iYear, iMonth, iDate, 0, 0, 0, 0);
			}	
			return dFinalDueDate;
		}
	};

	return oGanttUtils;
});
