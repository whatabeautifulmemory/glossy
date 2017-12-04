var table_msiinstaller;
var table_program_inventory;
var table_shell_core;
var table_registry;

function datatables_installation_operation_type_renderer(data, type, row){
    var return_value = "-";
    //
    var types = {
        "%%1904": "<span class=\"label label-primary\">생성</span>",
        "%%1905": "<span class=\"label label-danger\">삭제</span>",
        "%%1906": "<span class=\"label label-success\">수정</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}

function datatables_installation_value_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "%%1873": "REG_SZ",
        "%%1874": "REG_EXPAND_SZ",
        "%%1875": "REG_BINARY",
        "%%1876": "REG_DWORD",
        "%%1879": "REG_MULTI_SZ",
        "%%1883": "REG_QWORD"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}

function datatables_installation_event_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "1033": "<span class=\"label label-primary\">설치</span>",
        "1034": "<span class=\"label label-danger\">삭제</span>",
        "1035": "<span class=\"label label-success\">변경</span>",

        "903": "<span class=\"label label-primary\">설치(Non-MSI)</span>",
        "904": "<span class=\"label label-primary\">설치(MSI)</span>",
        "905": "<span class=\"label label-success\">변경</span>",
        "907": "<span class=\"label label-danger\">삭제(Non-MSI)</span>",
        "908": "<span class=\"label label-danger\">삭제(MSI)</span>",

        "28115" : "<span class=\"label label-primary\">설치</span>",

        "4657" : "<span class=\"label label-primary\">생성/변경</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}

function render_heatmap(url, heatmap_id, prev_selector, next_selector, datetime_filter_input_selector, target_table){
    axios({
        method: "get",
        url: url,
        responseType: "json"
    }).then(function(response) {
        $(heatmap_id).text("");
        var created_chart = echarts.init(document.getElementById(heatmap_id), "wonderland");

        created_chart.setOption({
            tooltip: {
                position: 'bottom'
            },
            visualMap: {
                // min: 0,
                // max: 1000,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                top: 'top'
            },
            calendar: [
            {
                range: new Date().getFullYear(),
                cellSize: ['auto', 'auto']
            }],

            series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                calendarIndex: 0,
                data: response.data
            }]
        });

        created_chart.on("click", function(params){
            $(datetime_filter_input_selector).each(function(idx, input_object){
                $(input_object).data("DateTimePicker").date(params.value[0]);
            });

            yadcf.exFilterExternallyTriggered(target_table);
        });

        $(prev_selector).on("click", function(params){
            created_chart.setOption({
                calendar: {
                    range: created_chart.getOption().calendar[0].range - 1
                }
            });
        });

        $(next_selector).on("click", function(params){
            created_chart.setOption({
                calendar: {
                    range: created_chart.getOption().calendar[0].range + 1
                }
            });
        });

        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            created_chart.resize();
        });

        $(window).on('resize', function (e) {
            created_chart.resize();
        });
    });
}

function refresh_software_install_msiinstaller() {
    axios({
        method: "get",
        url:"./ajax_events_msi",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_msiinstaller = $("#id_table_msiinstaller").DataTable({
            columnDefs: [
                {
                    "render": datatables_installation_event_type_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7,8]
                },
                {
                    "visible": false,
                    "targets": [0]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "EventData.Data.0.#text" },
                { data: "EventData.Data.1.#text" },
                { data: "EventData.Data.4.#text" },

                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 8, "desc" ]],
            data: events,
            colReorder: true,
            autoWidth: false,
            scrollX: false,
            deferRender: true,

            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],

            dom: 'Bfrtipl',
            buttons: [
                {
                    extend: 'colvis',
                    text: '<i class="fa fa-columns" aria-hidden="true"> 컬럼 표시/숨김</i>'
                },
                {
                    extend: 'copy',
                    text: '<i class="fa fa-clipboard" aria-hidden="true"> 클립보드에 복사</i>'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print" aria-hidden="true"> 인쇄하기</i>'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-floppy-o" aria-hidden="true"> CSV로 내보내기</i>'
                }
            ],
            bDestroy: true,
            initComplete: function(){

            }
        });

        yadcf.init(table_msiinstaller,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_msiinstaller_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_msiinstaller_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_msiinstaller_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "소프트웨어 이름",
                filter_container_id: "id_filter_msiinstaller_software_name",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "소프트웨어 제조사",
                filter_container_id: "id_filter_msiinstaller_vendor_name",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 8,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_msiinstaller_localtimecreated",
                filter_plugin_options: {
                    showTodayButton: true,
                    showClear: true
                },
                filter_reset_button_text: false
            }],
            {
                externally_triggered: true,
                onInitComplete: function(){
                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });
                    render_heatmap(
                        "./ajax_installation_heatmap_msi"
                        , "id_installation_heatmap_msi"
                        , "#id_installation_heatmap_msi_prev"
                        , "#id_installation_heatmap_msi_next"
                        , "#id_filter_msiinstaller_localtimecreated input"
                        , table_msiinstaller
                    );
                }
            }
        );
    });
}

function refresh_software_install_program_inventory() {
    axios({
        method: "get",
        url:"./ajax_events_program_inventory",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_program_inventory = $("#id_table_program_inventory").DataTable({
            columnDefs: [
                {
                    "render": datatables_installation_event_type_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7,8,9,10,11,12]
                },
                {
                    "visible": false,
                    "targets": [0, 8, 9, 10, 11]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "UserData.ProgramChangeInfoEvent.Name.#text" },
                { data: "UserData.ProgramChangeInfoEvent.Version.#text" },
                { data: "UserData.ProgramChangeInfoEvent.Publisher.#text" },
                { data: "UserData.ProgramChangeInfoEvent.Language.#text" },
                { data: "UserData.ProgramChangeInfoEvent.Source.#text" },
                { data: "UserData.ProgramChangeInfoEvent.ProgramID.#text" },
                { data: "UserData.ProgramChangeInfoEvent.FileInstanceID.#text" },

                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 12, "desc" ]],
            data: events,
            colReorder: true,
            autoWidth: false,
            scrollX: false,
            deferRender: true,

            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],

            dom: 'Bfrtipl',
            buttons: [
                {
                    extend: 'colvis',
                    text: '<i class="fa fa-columns" aria-hidden="true"> 컬럼 표시/숨김</i>'
                },
                {
                    extend: 'copy',
                    text: '<i class="fa fa-clipboard" aria-hidden="true"> 클립보드에 복사</i>'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print" aria-hidden="true"> 인쇄하기</i>'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-floppy-o" aria-hidden="true"> CSV로 내보내기</i>'
                }
            ],
            bDestroy: true,
            initComplete: function(){
            }
        });

        yadcf.init(table_program_inventory,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_program_inventory_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_program_inventory_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_program_inventory_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "소프트웨어 이름",
                filter_container_id: "id_filter_program_inventory_software_name",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "소프트웨어 제조사",
                filter_container_id: "id_filter_program_inventory_vendor_name",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 12,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_program_inventory_localtimecreated",
                filter_plugin_options: {
                    showTodayButton: true,
                    showClear: true
                },
                filter_reset_button_text: false
            }],
            {
                externally_triggered: true,
                onInitComplete: function(){
                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });

                    render_heatmap(
                        "./ajax_installation_heatmap_program_inventory"
                        , "id_installation_heatmap_program_inventory"
                        , "#id_installation_heatmap_program_inventory_prev"
                        , "#id_installation_heatmap_program_inventory_next"
                        , "#id_filter_program_inventory_localtimecreated input"
                        , table_program_inventory
                    );
                }
            }
        );
    });
}

function refresh_software_install_shell_core() {
    axios({
        method: "get",
        url:"./ajax_events_shell_core",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_shell_core = $("#id_table_shell_core").DataTable({
            columnDefs: [
                {
                    "render": datatables_installation_event_type_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7]
                },
                {
                    "visible": false,
                    "targets": [0]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "EventData.Data.0.#text" },
                { data: "EventData.Data.1.#text" },

                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 7, "desc" ]],
            data: events,
            colReorder: true,
            autoWidth: false,
            scrollX: false,
            deferRender: true,

            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],

            dom: 'Bfrtipl',
            buttons: [
                {
                    extend: 'colvis',
                    text: '<i class="fa fa-columns" aria-hidden="true"> 컬럼 표시/숨김</i>'
                },
                {
                    extend: 'copy',
                    text: '<i class="fa fa-clipboard" aria-hidden="true"> 클립보드에 복사</i>'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print" aria-hidden="true"> 인쇄하기</i>'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-floppy-o" aria-hidden="true"> CSV로 내보내기</i>'
                }
            ],
            bDestroy: true,
            initComplete: function(){

            }
        });

        yadcf.init(table_shell_core,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_shell_core_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_shell_core_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "Name",
                filter_container_id: "id_filter_shell_core_name",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 7,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_shell_core_localtimecreated",
                filter_plugin_options: {
                    showTodayButton: true,
                    showClear: true
                },
                filter_reset_button_text: false
            }],
            {
                externally_triggered: true,
                onInitComplete: function(){
                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });

                    render_heatmap(
                        "./ajax_installation_heatmap_shell_core"
                        , "id_installation_heatmap_shell_core"
                        , "#id_installation_heatmap_shell_core_prev"
                        , "#id_installation_heatmap_shell_core_next"
                        , "#id_filter_shell_core_localtimecreated input"
                        , table_shell_core
                    );
                }
            }
        );
    });
}

function refresh_software_install_registry() {
    axios({
        method: "get",
        url:"./ajax_events_registry",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_registry = $("#id_table_registry").DataTable({
            columnDefs: [
                {
                    "render": datatables_installation_event_type_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_installation_operation_type_renderer,
                    "targets": [6]
                },
                {
                    "render": datatables_installation_value_type_renderer,
                    "targets": [9,11]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,7,8,10,12,13,14,15]
                },
                {
                    "visible": false,
                    "targets": [0,8,9,10,11,12,13,14]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },
                { data: "_PluginOutput.ObjectName" },
                { data: "_PluginOutput.OperationType" },
                { data: "_PluginOutput.ObjectValueName" },
                { data: "_PluginOutput.HandleId_Numeric" },
                { data: "_PluginOutput.OldValueType" },
                { data: "_PluginOutput.OldValue" },
                { data: "_PluginOutput.NewValueType" },
                { data: "_PluginOutput.NewValue" },
                { data: "_PluginOutput.ProcessId_Numeric" },
                { data: "_PluginOutput.ProcessName" },
                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 15, "desc" ]],
            data: events,
            colReorder: true,
            autoWidth: false,
            scrollX: false,
            deferRender: true,

            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],

            dom: 'Bfrtipl',
            buttons: [
                {
                    extend: 'colvis',
                    text: '<i class="fa fa-columns" aria-hidden="true"> 컬럼 표시/숨김</i>'
                },
                {
                    extend: 'copy',
                    text: '<i class="fa fa-clipboard" aria-hidden="true"> 클립보드에 복사</i>'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print" aria-hidden="true"> 인쇄하기</i>'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-floppy-o" aria-hidden="true"> CSV로 내보내기</i>'
                }
            ],
            bDestroy: true,
            initComplete: function(){

            }
        });

        yadcf.init(table_registry,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_registry_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_registry_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_registry_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },

            {
                column_number: 15,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_registry_localtimecreated",
                filter_plugin_options: {
                    showTodayButton: true,
                    showClear: true
                },
                filter_reset_button_text: false
            }],
            {
                externally_triggered: true,
                onInitComplete: function(){
                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });

                    render_heatmap(
                        "./ajax_installation_heatmap_registry"
                        , "id_installation_heatmap_registry"
                        , "#id_installation_heatmap_registry_prev"
                        , "#id_installation_heatmap_registry_next"
                        , "#id_filter_registry_localtimecreated input"
                        , table_registry
                    );
                }
            }
        );
    });
}

$(document).ready(function(){
    refresh_software_install_msiinstaller();
    refresh_software_install_program_inventory();
    refresh_software_install_shell_core();
    refresh_software_install_registry();
});