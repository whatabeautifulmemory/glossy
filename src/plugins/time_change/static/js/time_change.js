var table_events;

function render_time_change_chart() {
    var div_width =  document.getElementById('id_statistics').offsetWidth;
    var security_chart = c3.generate({
        bindto: "#id_security_chart",
        data: {
            x : 'x',
            columns: [
                ["x" ],
                ["Security"]
            ],
            colors: {
                Security: '#ff0000'
              },
            type: 'area-step'
        },
        axis: {
            x: {
                type: 'category' ,
                tick: {
                    fit: false,
                    culling: {
                        max: 0
                    }
                }
            }
        },
        subchart: { show: true },
        size: {width: div_width*0.7, height: 300},
        zoom: { enabled: true }
    });
    var system_chart = c3.generate({
        bindto: "#id_system_chart",
        data: {
            x : 'x',
            columns: [
                ["x" ],
                ["System"]
            ],
             colors: {
                System: '#0000ff'
              },
            type: 'area-step'
        },
        axis: {
            x: {
                type: 'category' ,
                tick: {
                    fit: false,
                    culling: {
                        max: 0
                    }
                }
            }
        },
        subchart: { show: true },
        size: {width: div_width*0.7, height: 300},
        zoom: { enabled: true }
    });

    $.ajax({
        url: "./ajax_dashboard_events",
        success: function (data, status, xhr) {


        var returned_data = JSON.parse(data);

        var security_table_data = returned_data[2];
        for (var i in security_table_data) {
            $('#id_security_table').append('<tr><td>기존: '+security_table_data[i][0]+ '<br>변경 : '+security_table_data[i][1]+'</td><td>'+ security_table_data[i][2]+'</td></tr>');
        }

        var system_table_data = returned_data[3];
        for (var i in system_table_data) {
            $('#id_system_table').append('<tr><td>기존: '+system_table_data[i][0]+ '<br>변경 : '+system_table_data[i][1]+'</td><td>'+ system_table_data[i][2]+'</td></tr>');
        }


        security_chart.load({
            columns: returned_data[0]
            });

        system_chart.load({
            columns: returned_data[1]
            });
        }
    });
}

function render_time_change_events() {
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
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,5,6,7,8]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginOutput.ProcessName" },
                { data: "_PluginOutput.LocalPreviousTime" },
                { data: "_PluginOutput.LocalNewTime" },
                { data: "_PluginOutput.TimeGapSeconds" },

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
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 7,
                filter_type: "range_number",
                filter_container_id: "id_filter_time_gap",
                // style_class: "form-control",
                filter_reset_button_text: false
            },
            {
                column_number: 8,
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
    render_time_change_events();
    render_time_change_chart();
});