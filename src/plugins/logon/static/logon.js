var table_events;

function render_logon_charts() {
    var chart = c3.generate({
        bindto: "#id_chart",
        data: {
            type: 'scatter',

            xs: {
                로컬_로그온: 'logon_local_date',
                네트워크_로그온: 'logon_network_date',
                원격_로그온: 'logon_remote_date',
                화면잠금_해제: 'logon_screenlock_date',
                로그오프: 'logoff_date',
                화면잠금: 'logoff_screenlock_date',
                로그온_실패: 'logon_fail_date'
            },
            columns: [
                ["alogon_local_date" ],
                ["logon_network_date"],
                ["logon_remote_date"],
                ["logon_screenlock_date"],
                ["logoff_date" ],
                ["logoff_screenlock_date"],
                ["logon_fail_date"],

                ["logon_local_time" ],
                ["logon_network_time"],
                ["logon_remote_time"],
                ["logon_screenlock_time"],
                ["logoff_time" ],
                ["logoff_screenlock_time"],
                ["logon_fail_time"]
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
            {axis: 'y', start: 1200, end: 1300, class: 'regionBlue'}]

    });

    $.ajax({
        url: "./ajax_dashboard_events",
        success: function (data, status, xhr) {
            var returned_data = JSON.parse(data);
            var chart_data = returned_data[0];
            var logon_type_chart_data = returned_data[1];
            var logon_account_chart_data = returned_data[2];

            var summary_data = returned_data[3];

            document.getElementById("local_logon").innerHTML = summary_data[0] + "회";
            document.getElementById("network_logon").innerHTML = summary_data[1] + "회";
            document.getElementById("remote_logon").innerHTML = summary_data[2] + "회";
            document.getElementById("screenlock_logon").innerHTML = summary_data[3] + "회";
            document.getElementById("local_logoff").innerHTML = summary_data[4] + "회";
            document.getElementById("screenlock_logoff").innerHTML = summary_data[5] + "회";
            document.getElementById("logon_fail").innerHTML = summary_data[6] + "회";
                /*
            document.getElementById("saving_on").innerHTML = summary_data[4] + "회";
            document.getElementById("saving_off").innerHTML = summary_data[5] + "회";
            document.getElementById("total_on").innerHTML = summary_data[0] + summary_data[2] + summary_data[4] + "회";
            document.getElementById("total_off").innerHTML = summary_data[1] + summary_data[3] + summary_data[5] + "회";

            */
            chart.load({
                columns: chart_data
            });

            // TODO : 변수 이름 및 코드, 설정, 디자인 등 정리 필요
            ///////////////////////// echarts example ////////////////////////
            var chart_legends = [];
            var chart_datas = [];
            logon_account_chart_data.forEach( function(value, index){
                chart_legends.push(value[0]);
                chart_datas.push({
                    name: value[0],
                    value: value[1]
                });
            });
            // console.log(chart_legends);
            // console.log(chart_datas);

            var option = {
                title : {
                    text: '로그인 통계',
                    subtext: '계정별',
                    x:'center'
                },
                tooltip : {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    type: 'scroll',
                    orient: 'vertical',
                    right: 10,
                    top: 20,
                    bottom: 20,
                    data: chart_legends
                },
                series : [
                    {
                        name: '계정명',
                        type: 'pie',
                        radius : '55%',
                        center: ['40%', '50%'],
                        data: chart_datas, // series
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
            var id_logon_account_chart_ = echarts.init(document.getElementById("id_logon_account_chart_"));
            id_logon_account_chart_.setOption(option);
            id_logon_account_chart_.on('click', function (params) {
                $("#id_filter_targetusername select").val(params.name);
                $(".chosen-select").chosen({ width: '100%' }).trigger("chosen:updated");
                yadcf.exFilterExternallyTriggered(table_events);
                $("[href=\"#id_detail\"]").tab("show");
            });

            ///////////////////////// echarts example ////////////////////////
            var chart_legends = [];
            var chart_datas = [];
            logon_type_chart_data.forEach( function(value, index){
                chart_legends.push(value[0]);
                chart_datas.push({
                    name: value[0],
                    value: value[1]
                });
            });
            console.log(chart_legends);
            console.log(chart_datas);

            var option = {
                title : {
                    text: '로그인 통계',
                    subtext: '유형별',
                    x:'center'
                },
                tooltip : {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    type: 'scroll',
                    orient: 'vertical',
                    right: 10,
                    top: 20,
                    bottom: 20,
                    data: chart_legends
                },
                series : [
                    {
                        name: '유형',
                        type: 'pie',
                        radius : '55%',
                        center: ['40%', '50%'],
                        data: chart_datas, // series
                        itemStyle: {
                            emphasis: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
            var id_logon_type_chart_ = echarts.init(document.getElementById("id_logon_type_chart_"));
            id_logon_type_chart_.setOption(option);
            id_logon_type_chart_.on('click', function (params) {
                var id = params.name.replace("_", " ");
                $("#id_filter_status select").val(id);
                $(".chosen-select").chosen({ width: '100%' }).trigger("chosen:updated");
                yadcf.exFilterExternallyTriggered(table_events);
                $("[href=\"#id_detail\"]").tab("show");
            });
        }
    });
}

function render_logon_events() {
    axios({
        method: "get",
        url:"./ajax_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "bVisible": false, "aTargets": [ 0,1 ]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,5,6,7,8,9]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginResult.Gubun" },
                { data: "_PluginResult.Status" },
                { data: "_PluginResult.TargetUserName" },
                { data: "_Metadata.LocalTimeCreated" },
                { data: "_PluginResult.Etc" },
                { data: "_PluginResult.Address" }
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
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "구분",
                filter_container_id: "id_filter_type",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "상태",
                filter_container_id: "id_filter_status",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "로그인아이디",
                filter_container_id: "id_filter_targetusername",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 7,
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
    render_logon_events();
    render_logon_charts();
});