/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseView.controller",
		"sap/rsh/eam/lib/common/formatters/formatter",
		"sap/rsh/eam/lib/common/utils/GanttUtils",
		"sap/rsh/eam/lib/common/controller/GanttSettingsDialog.controller",
		"sap/rsh/eam/lib/common/controller/ColumnAdaption",
		"sap/rsh/eam/lib/common/controller/ModelPromises.controller",
		"sap/rsh/eam/lib/common/controller/SystemTimeZone.controller",
		"sap/rsh/eam/lib/common/people/PeopleGanttDialog.controller",
		"sap/rsh/eam/lib/common/people/UnassignPeople.controller",
		"sap/rsh/eam/lib/common/variant/CustomVariant.controller",
		"rsh/eam/ordergantts1/mvc/filterbar/FilterBar.controller",
		"rsh/eam/ordergantts1/mvc/filterbar/FilterBarSearch.controller",
		"rsh/eam/ordergantts1/mvc/filterbar/TimePeriod.controller",
		"rsh/eam/ordergantts1/mvc/gantt/GanttContainer.controller",
		"rsh/eam/ordergantts1/mvc/gantt/GanttSearch.controller",
		"rsh/eam/ordergantts1/mvc/gantt/GanttSettings.controller",
		"rsh/eam/ordergantts1/mvc/gantt/GanttSettingsDialogConfiguration",
		"rsh/eam/ordergantts1/mvc/gantt/GanttVariant.controller",
		"rsh/eam/ordergantts1/mvc/gantt/PersGanttSettings.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/Fields.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/formatters",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/Metadata.controller",
		"rsh/eam/ordergantts1/mvc/utilgantt/UtilizationGantt.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/DeltaRefresh.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/menu/OperationActionSheet.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/menu/ContextMenus.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/ColumnFields.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/DispatchOperations.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/EditRelationships.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/ColumnSettings.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/toolbar/EnableToolbarButtons.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/Messages.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/OpenOrders.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/OrderGantt.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/ExpandOrders.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/Filters.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/OpenLinks.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/ScheduleOrders.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/AssignEvent.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/UpdateOrderOpDates.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/actions/ChangeOperations.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/Sort.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/CalendarBinding.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/Binding.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/RelationshipsBinding.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/UtilizationBinding.controller",
		"rsh/eam/ordergantts1/mvc/ordergantt/binding/LabelFields.controller",
		"rsh/eam/ordergantts1/mvc/ContentDensity.controller",
		"rsh/eam/ordergantts1/mvc/DeltaRefresh.controller",
		"rsh/eam/ordergantts1/mvc/Navigation.controller",
		"rsh/eam/ordergantts1/mvc/PersAppState.controller",
		"rsh/eam/ordergantts1/mvc/Submit.controller",
		"rsh/eam/ordergantts1/mvc/WorkCenter.controller",
		"sap/rsh/eam/lib/common/utils/DateUtils"
	],
	function (
		BaseController,
		commonFormatter,
		GanttUtils,
		GanttSettingsDialogController,
		ColumnAdaption,
		ModelPromisesController,
		SystemTimeZoneController,
		PeopleGanttDialogController,
		UnassignPeopleController,
		CustomVariantController,
		FilterBarController,
		FilterBarSearchController,
		TimePeriodController,
		GanttContainerController,
		GanttSearchController,
		GanttSettingsController,
		GanttSettingsDialogConfiguration,
		GanttVariantController,
		PersGanttSettings,
		FieldsController,
		formatters,
		MetadataController,
		UtilizationGanttController,
		OrderGanttDeltaRefreshController,
		OperationActionSheetController,
		ContextMenusController,
		ColumnFieldsController,
		DispatchOperationsController,
		EditRelationshipsController,
		ColumnSettingsController,
		EnableToolbarButtonsController,
		MessagesController,
		OpenOrdersController,
		OrderGanttController,
		ExpandOrdersController,
		FiltersController,
		OpenLinksController,
		ScheduleOrdersController,
		AssignEvent,
		UpdateOrderOpDatesController,
		ChangeOperationsController,
		SortController,
		CalendarBindingController,
		BindingController,
		RelationshipsBindingController,
		UtilizationBindingController,
		LabelFieldsController,
		ContentDensityController,
		DeltaRefreshController,
		NavigationController,
		PersAppState,
		SubmitController,
		WorkCenterController,
		DateUtils
	) {
		"use strict";

		return BaseController.extend("rsh.eam.ordergantts1.mvc.SchedulingBoard", {
			formatters: formatters,
			commonFormatters: commonFormatter,
			ganttUtils: GanttUtils,
			dateUtils: DateUtils,

			onInit: function () {
				BaseController.prototype.onInit.apply(this, arguments);
				this._createControllers();
				this.initMessagePopover();
				this.attachModelErrorHandler("readModel");
			},

			onExit: function () {
				this.controllers.persAppState.save();
			},

			_createControllers: function () {
				this.controllers.board = this;

				// root level
				this.controllers.customVariant = new CustomVariantController({
					parent: this,
					variantHandler: this.byId("variantHandler")
				});
				this.controllers.ganttContainer = new GanttContainerController(this);
				this.controllers.persGanttSettings = new PersGanttSettings(this); // after ganttContainer
				this.controllers.persAppState = new PersAppState(this); // after ganttContainer
				this.controllers.contentDensity = new ContentDensityController(this); // after persGanttSettings
				this.controllers.modelPromises = new ModelPromisesController(this.oComponent);
				this.controllers.systemTimeZone = new SystemTimeZoneController(this);
				this.controllers.deltaRefresh = new DeltaRefreshController(this);
				this.controllers.filterBar = new FilterBarController(this);
				this.controllers.filterBarSearch = new FilterBarSearchController(this);
				this.controllers.ganttVariant = new GanttVariantController(this);
				this.controllers.ganttSettings = new GanttSettingsController(this);
				this.controllers.ganttSettingsDialog = new GanttSettingsDialogController(this.oComponent, this.getView(), GanttSettingsDialogConfiguration);
				this.controllers.navigation = new NavigationController(this);
				this.controllers.submit = new SubmitController(this);
				this.controllers.timePeriod = new TimePeriodController(this);
				this.controllers.workCenter = new WorkCenterController(this);
				this.controllers.ganttSearch = new GanttSearchController(this);

				// order gantt
				this.controllers.ordergantt = {};
				this.controllers.ordergantt.calendarBinding = new CalendarBindingController(this);
				this.controllers.ordergantt.binding = new BindingController(this);
				this.controllers.ordergantt.relationshipsBinding = new RelationshipsBindingController(this);
				this.controllers.ordergantt.utilizationBinding = new UtilizationBindingController(this);
				this.controllers.ordergantt.deltaRefresh = new OrderGanttDeltaRefreshController(this);
				this.controllers.ordergantt.metadata = new MetadataController(this);
				this.controllers.ordergantt.operationActionSheet = new OperationActionSheetController(
					this.oComponent,
					this.getView(),
					this.byId("idOrderGanttChartWithTable")
				);
				this.controllers.ordergantt.dispatchOperations = new DispatchOperationsController(this);
				this.controllers.ordergantt.enableToolbarButtons = new EnableToolbarButtonsController(this);
				this.controllers.ordergantt.messages = new MessagesController(this);
				this.controllers.ordergantt.openOrders = new OpenOrdersController(this);
				this.controllers.ordergantt.filters = new FiltersController(this);
				this.controllers.ordergantt.expandOrders = new ExpandOrdersController(this);
				this.controllers.ordergantt.openLinks = new OpenLinksController(this);
				this.controllers.ordergantt.scheduleOrders = new ScheduleOrdersController(this);
				this.controllers.ordergantt.editRelationships = new EditRelationshipsController(this);
				this.controllers.ordergantt.columnSettings = new ColumnSettingsController(this);
				this.controllers.ordergantt.fields = new FieldsController(this);
				this.controllers.ordergantt.columnFields = new ColumnFieldsController(this);
				this.controllers.ordergantt.labelFields = new LabelFieldsController(this);
				this.controllers.ordergantt.assignEvent = new AssignEvent(this);
				this.controllers.ordergantt.columnAdaption = new ColumnAdaption({
					component: this.oComponent,
					entitySet: "C_RSHOrdersAndOperations",
					table: this.byId("idOrderTreeTable")
				});
				this.controllers.ordergantt.updateOrderOpDates = new UpdateOrderOpDatesController(this);
				this.controllers.ordergantt.peopleGanttDialog = new PeopleGanttDialogController(this.oComponent, this.getView());
				this.controllers.ordergantt.unassignPeople = new UnassignPeopleController(this);
				this.controllers.ordergantt.changeOperations = new ChangeOperationsController(this);
				this.controllers.ordergantt.contextMenus = new ContextMenusController(this);

				// after customVariant, ganttContainer (sequence of custom variant events), metadata, sort,
				// persGanttSettings, columnAdaption, relationshipsBinding, utilizationBinding
				this.controllers.orderGantt = new OrderGanttController({
					component: this.oComponent,
					controller: this,
					gantt: this.byId("idOrderGanttChartWithTable")
				});

				// after orderGantt
				this.controllers.ordergantt.sort = new SortController(this);

				// after customVariant, ganttContainer/orderGantt (sequence of custom variant events)
				this.controllers.utilizationGantt = new UtilizationGanttController({
					component: this.oComponent,
					dependent: this.getView(),
					filterBar: this.byId("idOrderGanttSmartFilterBar")
				});
			},

			onSmartFilterInitialized: function (oEvent) {
				this.controllers.navigation.initAppState();
			},

			onAssignedFiltersChanged: function (oEvent) {
				if (this.controllers) {
					this.controllers.filterBar.onAssignedFiltersChanged(oEvent);
				}
			},

			onOrderTableSelectRows: function (oEvent) {
				this.controllers.orderGantt.onSelectRows(oEvent);
			},

			onOrderTableSort: function (oEvent) {
				this.controllers.orderGantt.onSort(oEvent);
			},

			onOrderTableFirstVisibleRowChanged: function (oEvent) {
				this.controllers.orderGantt.onFirstVisibleRowChanged();
			},

			onAfterVariantLoad: function (oEvent) {
				this.controllers.timePeriod.onAfterVariantLoad(oEvent);
			},

			onFilterBarSearch: function () {
				this.controllers.filterBarSearch.search();
			},

			onCustomVariantApplyChange: function (oEvent) {
				this.controllers.customVariant.onApplyChange(oEvent);
			},

			onCustomVariantRevertChange: function (oEvent) {
				this.controllers.customVariant.onRevertChange(oEvent);
			},

			onToggleOpenState: function (oEvent) {
				this.controllers.ordergantt.expandOrders.onExpandRow(oEvent);
			},

			onPressAssignPeopleButton: function (oEvent) {
				var aSelectedOpRowPaths = this.controllers.orderGantt.getSelectedOperationPaths();
				this.controllers.orderGantt.assignPeople(aSelectedOpRowPaths);
			},

			onPressUnassignPeopleButton: function (oEvent) {
				var aSelectedOpRowPaths = this.controllers.orderGantt.getSelectedOperationPaths();
				this.controllers.orderGantt.unassignPeople(aSelectedOpRowPaths);
			},

			onPressDispatchButton: function (oEvent) {
				this.controllers.ordergantt.dispatchOperations.dispatch(null);
			},

			onPressCancelDispatchButton: function (oEvent) {
				this.controllers.ordergantt.dispatchOperations.cancelDispatch(null);
			},

			onPressRemoveConstraintsButton: function (oEvent) {
				this.controllers.ordergantt.dispatchOperations.removeConstraints(null);
			},

			onOrderOperationLinkPress: function (oEvent) {
				this.controllers.ordergantt.openLinks.openOrderOperation(oEvent);
			},

			onTechnicalObjectLinkPress: function (oEvent) {
				this.controllers.ordergantt.openLinks.openTechnicalObject(oEvent);
			},

			onFuncLocLinkPress: function (oEvent) {
				this.controllers.ordergantt.openLinks.openFunctionalLocation(oEvent);
			},

			onEquipmentLinkPress: function (oEvent) {
				this.controllers.ordergantt.openLinks.openEquipment(oEvent);
			},

			onMaintEventLinkPress: function (oEvent) {
				this.controllers.ordergantt.openLinks.openMaintEvent(oEvent);
			},

			onScheduleLinkPress: function (oEvent) {
				this.controllers.ordergantt.openLinks.openSchedules(oEvent);
			},

			onPressScheduleOrderButton: function () {
				this.controllers.ordergantt.scheduleOrders.schedule(null);
			},

			onColumnSettingsPress: function (oEvent) {
				this.controllers.ordergantt.columnSettings.onOpen(oEvent);
			},

			onGanttSidePanel: function (oEvent) {
				this.controllers.ganttSearch.onGanttSidePanel(oEvent);
			},

			onSearchResultsCompute: function (oEvent) {
				this.controllers.ganttSearch.onSearchResultsCompute(oEvent);
			},

			onFindShapes: function (oEvent) {
				this.controllers.ganttSearch.onFindShapes(oEvent);
			},

			onSearchSidePanelRender: function (oEvent) {
				this.controllers.ganttSearch.onSearchSidePanelRender(oEvent);
			},

			onExpandSelectedOrders: function (oEvent) {
				this.controllers.ordergantt.expandOrders.expandSelectedOrders();
			},

			onCollapseSelectedOrders: function (oEvent) {
				this.controllers.ordergantt.expandOrders.collapseSelectedOrders();
			},

			onChangeGanttViewState: function (oEvent) {
				this.controllers.ganttContainer.onChangeGanttViewState(oEvent);
			},

			onColumnResize: function (oEvent) {
				this.controllers.orderGantt.onColumnResize(oEvent);
			},

			onColumnVisibilityChanged: function (oEvent) {
				this.controllers.orderGantt.onColumnVisibilityChanged(oEvent);
			},

			onShowHideButtonPress: function (oEvent) {
				this.controllers.orderGantt.onShowHideButtonPress(oEvent);
			},

			onVisibleHorizonUpdate: function (oEvent) {
				this.controllers.orderGantt.onVisibleHorizonUpdate(oEvent);
			},

			pressChangeOperationsButton: function (oEvent) {
				this.controllers.ordergantt.changeOperations.change(oEvent, null);
			},

			onCustomGanttSettingPress: function (oEvent) {
				this.controllers.ganttSettings.openDialog();
			},

			onShapeContextMenu: function (oEvent) {
				this.controllers.ordergantt.contextMenus.open(oEvent);
			},

			onDragAndDrop: function (oEvent) {
				this.controllers.ordergantt.updateOrderOpDates.onDragAndDropShape(oEvent);
			},

			onRelationshipCreate: function (oEvent) {
				this.controllers.ordergantt.editRelationships.onCreate(oEvent);
			},

			onChangeWorkCenterCapacity: function (oEvent) {
				this.controllers.workCenter.openChangeCapacityDialog();
			},

			onAssignWorkCenters: function (oEvent) {
				this.controllers.workCenter.openAssignDialog(this._oMessageHandlerResponseModel);
			},

			onGanttVariantApplied: function (oEvent) {
				this.controllers.ganttVariant.onGanttVariantApplied(oEvent);
			}
		});
	}
);
