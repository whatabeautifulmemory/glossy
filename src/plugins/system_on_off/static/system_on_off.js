var table_events;


function datatables_system_on_off_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "start": "<span class=\"label label-primary\">시작</span>",
        "stop": "<span class=\"label label-danger\">종료</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}

function render_system_on_off_chart(){
    var chart = c3.generate({
        bindto: "#id_chart",
        data: {
            type: 'scatter',
            xs: {
                PC_시작: 'systemon_date',
                PC_종료: 'systemoff_date',
                절전모드_시작: 'savingon_date',
                절전모드_종료: 'savingoff_date'
            },
            columns: [
                ["systemon_date" ],
                ["systemoff_date"],

                ["systemon_time"],
                ["systemoff_time"],

                ["savingon_date" ],
                ["savingoff_date"],

                ["savingon_time"],
                ["savingoff_time"]
            ]
        },

        axis: {
            x: {
                type: 'timeseries',
                label: 'Date',
                tick: {
                    fit: false,
                    format: "%y-%m-%d",
                    culling: {
                        max: 0
                    }
                }
            },
            y: {
                label: 'Time',
                max: 2300,
                min: 100
            }
        },
        subchart: { show: true },
        size: {height: 450},
        zoom: { enabled: true },
        regions: [
            {axis: 'y', start: 0, end: 900, class: 'regionRed'},
            {axis: 'y', start: 1800, end: 2359, class: 'regionGreen'}]
    });

    $.ajax({
        url: "./ajax_scatter_plot_data",
        success: function (data, status, xhr) {
            var returned_data = JSON.parse(data);
            var chart_data = returned_data[0];
            var summary_data = returned_data[1];
            document.getElementById("normalmode_on").innerHTML = summary_data[0] + "회";
            document.getElementById("normalmode_off").innerHTML = summary_data[1] + "회";
            document.getElementById("safemode_on").innerHTML =  summary_data[2] + "회";
            document.getElementById("forced_off").innerHTML = summary_data[3] + "회";
            document.getElementById("saving_on").innerHTML = summary_data[4] + "회";
            document.getElementById("saving_off").innerHTML = summary_data[5] + "회";
            document.getElementById("total_on").innerHTML = summary_data[0] + summary_data[2] + summary_data[4] + "회";
            document.getElementById("total_off").innerHTML = summary_data[1] + summary_data[3] + summary_data[5] + "회";


            chart.load({
                columns: chart_data
            });
        }
    });
}


function refresh_system_on_off_events() {
    axios({
        method: "get",
        url:"./ajax_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "bVisible": false, "aTargets": [ 0 ]
                },
                {
                    "render": datatables_system_on_off_type_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "_PluginResult.Status" },
                { data: "System.Computer.#text" },

                { data: "_Metadata.LocalTimeCreated" },

                { data: "_PluginResult.Etc" }
            ],
            order: [[ 5, "desc" ]],
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

        yadcf.init(table_events,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_container_id: "id_filter_source",
                style_class: "form-control chosen-select",
                filter_default_label: "이벤트 파일",
                filter_reset_button_text: false
            },
            {
                column_number : 1,
                filter_type: "multi_select",
                filter_default_label: "Provider",
                filter_container_id: "id_filter_provider",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "상태",
                filter_container_id: "id_filter_status",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 5,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_localtimecreated",
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
                        "id_summary_chart", table_events, default_datetime_getter
                        , "#id_filter_localtimecreated input"
                    );
                }
            }
        );
    });
}

$(document).ready(function(){
    refresh_system_on_off_events();
    render_system_on_off_chart();
});