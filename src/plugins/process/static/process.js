var table_events_security_auditing;
var table_events_application_experience;
var table_summary_security_auditing;
var table_summary_application_experience;


var common_chart_option = {
        tooltip: {
            trigger: 'axis',
            position: function (pt) {
                return [pt[0], '10%'];
            }
        },
        grid: {
            // x: 40,
            y: 10
            // x2: 40,
        //     y2: 70
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ["a", "b", "c"]
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%']
        },
        dataZoom: [{
            type: 'inside'
        }, {
            // start: 0,
            // end: 10,
            handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            handleSize: '80%'
        }],
        series: [
            {
                name:'Events',
                type:'bar',
                smooth:true,
                symbol: 'none',
                sampling: 'average',
                data: [
                    "a", "2", "3"
                ]
            }
        ]
        // tooltip: {
        //     trigger: 'axis',
        //     position: function (pt) {
        //         return [pt[0], '10%'];
        //     }
        // },
        // xAxis: {
        //     type: 'category',
        //     boundaryGap: false,
        //     data: ["1", "2", "3"]
        // },
        // yAxis: {
        //     type: 'value',
        //     boundaryGap: [0, '100%']
        // },
        // dataZoom: [{
        //     type: 'inside'
        // }, {
        //     // start: 0,
        //     // end: 10,
        //     handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        //     handleSize: '80%'
        // }],
        // // legend: {
        // //     type: 'scroll',
        // //     orient: 'vertical',
        // //     right: 10,
        // //     top: 20,
        // //     bottom: 20,
        // //     data: [],
        // //     formatter: function(legend_name){
        // //         var splitted = legend_name.split("\\");
        // //
        // //         return splitted[splitted.length - 1];
        // //     }
        // // },
        // series : [
        //     // {
        //     //     name: '프로세스 이름',
        //     //     type: 'bar',
        //     //     smooth: true,
        //     //     symbol: "none",
        //     //     sampling: 'average',
        //     //     label: {
        //     //         normal: {
        //     //             formatter: function(params){
        //     //                 var splitted = params.name.split("\\");
        //     //                 var filename = splitted[splitted.length - 1];
        //     //
        //     //                 return filename + "(" + params.value + "회 실행, " + params.percent + "%)";
        //     //             }
        //     //         }
        //     //     },
        //     //     data: [1,2,3]
        //     // }
        //     {
        //         name:'Events',
        //         type:'bar',
        //         smooth:true,
        //         symbol: 'none',
        //         sampling: 'average',
        //         data: []
        //     }
        // ]
    };

function datatables_process_event_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "4688": "<span class=\"label label-primary\">실행</span>",
        "4689": "<span class=\"label label-danger\">종료</span>",

        "500" : "<span class=\"label label-primary\">실행</span>",
        "505" : "<span class=\"label label-primary\">실행</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}

function refresh_process_events_security_auditing(){
    axios({
        method: "get",
        url:"./ajax_events_security_auditing",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events_security_auditing = $("#id_table_events_security_auditing").DataTable({
            columnDefs: [
                {
                    "render": datatables_process_event_type_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7,8,9]
                },
                {
                    "visible": false,
                    "targets": [0, 8]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginOutput.NewProcessId_Numeric" },
                { data: "_PluginOutput.NewProcessName" },
                { data: "_PluginOutput.ParentProcessName" },
                { data: "_PluginOutput.CommandLine" },

                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 9, "desc" ]],
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
            bDestroy: true
        });

        yadcf.init(table_events_security_auditing,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_security_auditing_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_security_auditing_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_security_auditing_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "프로세스 이름",
                filter_container_id: "id_filter_security_auditing_newprocessname",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "부모 프로세스 이름",
                filter_container_id: "id_filter_security_auditing_parentprocessname",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 8,
                filter_type: "text",
                filter_default_label: "명령행",
                filter_container_id: "id_filter_security_auditing_commandline",
                style_class: "form-control",
                filter_reset_button_text: false
            },
            {
                column_number: 9,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_security_auditing_localtimecreated",
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

                    create_summary_chart(
                        "id_summary_chart_security_auditing", table_events_security_auditing, default_datetime_getter
                        , "#id_filter_security_auditing_localtimecreated input"
                    );
                }
            }
        );
    });
}

function refresh_process_events_application_experience(){
    axios({
        method: "get",
        url:"./ajax_events_application_experience",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events_application_experience = $("#id_table_events_application_experience").DataTable({
            columnDefs: [
                {
                    "render": datatables_process_event_type_renderer,
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

                { data: "UserData.CompatibilityFixEvent.ProcessId.#text" },
                { data: "UserData.CompatibilityFixEvent.ExePath.#text" },
                { data: "UserData.CompatibilityFixEvent.FixName.#text" },

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
            bDestroy: true
        });

        yadcf.init(table_events_application_experience,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_application_experience_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_application_experience_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_application_experience_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "프로세스 이름",
                filter_container_id: "id_filter_application_experience_exepath",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number: 8,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_application_experience_localtimecreated",
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

                    create_summary_chart(
                        "id_summary_chart_application_experience", table_events_application_experience, default_datetime_getter
                        , "#id_filter_application_experience_localtimecreated input"
                    );
                }
            }
        );
    });
}

function filter_process_events(tag, target_input_selector){
    var column_value = $(tag).text();

    $(target_input_selector + " select").val(column_value);
    $('.chosen-select').chosen().trigger('chosen:updated');

    yadcf.exFilterExternallyTriggered(table_events_security_auditing);

    var text = "'" + column_value + "' 이(가) 검색조건으로 반영되었습니다.";
    text = text + "<br>필터링 결과 : 총 " + table_events_security_auditing.rows({filter: 'applied'}).count() + " 개 이벤트";

    $.toast({
        heading: "검색조건 반영",
        text: text,
        stack: false,
        hideAfter: 10000,
        position: 'bottom-right',
        icon: 'info'
    });

    $("[href=\"#id_detail\"]").tab("show");
}

function update_process_summary_chart(target_chart, source_table){
    var datas = source_table.rows( { filter : 'applied'} ).data();
    var axis_x = [];
    var axis_y = [];
    var percentage = 0;

    console.log(datas);
    datas.each(function(row, idx) {
        axis_x.push(row[0]);
        axis_y.push(row[1]);
    });

    target_chart.setOption({
        xAxis: {
            data: axis_x
        },

        series: [{
            data: axis_y
        }],

        dataZoom: [{
            start: 0,
            end: 5.0 / axis_x.length * 100
        }]
    });
}


function initialize_process_summary_chart(target_id, datatables_summary_table_selector, datatables_event_table_selector, process_filter_input_selector, container_tab_selector){
    var created_chart = echarts.init(document.getElementById(target_id), "wonderland");
    var option = {
        tooltip: {
            trigger: 'axis',
            position: function (pt) {
                return [pt[0], '10%'];
            }
        },
        grid: {
            y: 10
        },
        xAxis: {
            type: 'category',
            boundaryGap: true,
            data: [],
            interval: 0,
            barWidth : 10,
            barMaxWidth : 10,
            axisLabel: {
                formatter: function(label_name){
                    var splitted = label_name.split("\\");
                    return splitted[splitted.length - 1];
                }
            }
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%']
        },
        dataZoom: [{
            type: 'inside'
        }, {
            start: 0,
            end: 10,
            handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            handleSize: '80%'
        }],
        series: [
            {
                name:'실행횟수',
                type:'bar',
                smooth: true,
                label: {
                    normal: {
                        formatter: function(params){
                            var splitted = params.name.split("\\");
                            var filename = splitted[splitted.length - 1];

                            return filename + "(" + params.value + "회 실행, " + params.percent + "%)";
                        }
                    }
                },
                data: []
            }
        ]
    };
    var summary_table = $(datatables_summary_table_selector).DataTable();

    created_chart.setOption(option);
    created_chart.on('click', function (params) {
        var event_table = $(datatables_event_table_selector).DataTable();

        console.log(event_table, params.name);
        $(process_filter_input_selector).val(params.name);
        $(".chosen-select").chosen({ width: '100%' }).trigger("chosen:updated");
        yadcf.exFilterExternallyTriggered(event_table);
        $("[href=\"" + container_tab_selector + "\"]").tab("show");
    });

    update_process_summary_chart(created_chart, summary_table);

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        created_chart.resize();
    });

    $(window).on('resize', function (e) {
        created_chart.resize();
    });

    return created_chart;
}

function Eofrkadl(manghal_tag){
    $("#id_filter_security_auditing_newprocessname select").val($(manghal_tag).text());
    $(".chosen-select").chosen({ width: '100%' }).trigger("chosen:updated");
    yadcf.exFilterExternallyTriggered(table_events_security_auditing);
    $("[href='#id_security_auditing']").tab("show");
}

function xkxkrxkxkr(manghal_tag){
    $("#id_filter_application_experience_exepath select").val($(manghal_tag).text());
    $(".chosen-select").chosen({ width: '100%' }).trigger("chosen:updated");
    yadcf.exFilterExternallyTriggered(table_events_application_experience);
    $("[href='#id_application_experience']").tab("show");
}

function refresh_process_summary_security_auditing() {
    axios({
        method: "get",
        url:"./ajax_chart_security_auditing",
        responseType: "json"
    }).then(function(response){
        var summary = response.data;

        table_summary_security_auditing = $("#id_table_summary_security_auditing").DataTable({
            columnDefs: [
                {
                    "render": function(data, type, row){
                        return "<a href='#' onclick='Eofrkadl(this); return false;'>" + (data||"-") + "</a>";
                    },
                    "targets": [0]
                }
            ],
            columns: [
                { data: 0 },
                { data: 1 }
            ],
            order: [[ 1, "desc" ]],
            data: summary,
            colReorder: true,
            autoWidth: false,
            scrollX: false,
            deferRender: true,

            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],

            dom: 'frtipl',
            bDestroy: true,
            initComplete: function(){
                initialize_process_summary_chart(
                    "id_chart_security_auditing"
                    , "#id_table_summary_security_auditing"
                    , "#id_table_events_security_auditing"
                    , "#id_filter_security_auditing_newprocessname select"
                    , "#id_security_auditing"
                );
            }
        });
    });
}


function refresh_process_summary_application_experience() {
    axios({
        method: "get",
        url:"./ajax_chart_application_experience",
        responseType: "json"
    }).then(function(response){
        var summary = response.data;

        table_summary_application_experience = $("#id_table_summary_application_experience").DataTable({
            columnDefs: [
                {
                    "render": function(data, type, row){
                        return "<a href='#' onclick='xkxkrxkxkr(this); return false;'>" + (data||"-") + "</a>";
                    },
                    "targets": [0]
                }
            ],
            columns: [
                { data: 0 },
                { data: 1 }
            ],
            order: [[ 1, "desc" ]],
            data: summary,
            colReorder: true,
            autoWidth: false,
            scrollX: false,
            deferRender: true,

            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],

            dom: 'frtipl',
            bDestroy: true,
            initComplete: function(){
                initialize_process_summary_chart(
                    "id_chart_application_experience"
                    , "#id_table_summary_application_experience"
                    , "#id_table_events_application_experience"
                    , "#id_filter_application_experience_exepath select"
                    , "#id_application_experience"
                );
            }
        });
    });
}


$(document).ready(function(){
    refresh_process_events_security_auditing();
    refresh_process_events_application_experience();

    refresh_process_summary_security_auditing();
    refresh_process_summary_application_experience();
});