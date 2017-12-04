

function filter_wireless_events(tag, target_input_selector){
    var column_value = $(tag).text();

    $(target_input_selector + " select").val(column_value);
    $('.chosen-select').chosen().trigger('chosen:updated');

    yadcf.exFilterExternallyTriggered(table_events);

    var text = "'" + column_value + "' 이(가) 검색조건으로 반영되었습니다.";
    text = text + "<br>필터링 결과 : 총 " + table_events.rows({filter: 'applied'}).count() + " 개 이벤트";
    text = text + "<br>('이벤트 상세분석' 탭 참조)";

    $.toast({
        heading: "검색조건 반영",
        text: text,
        stack: false,
        hideAfter: 10000,
        position: 'bottom-right',
        icon: 'info'
    });
}

function wireless_dashboard_filter_apply(data, target_id){
    return "<a href='#' onclick='filter_wireless_events(this, \""+ target_id +"\");return false;'>" + data + "</a>";
}

function wireless_event_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "8000": "<span class=\"label label-warning\"><a href='#' onclick='filter_wireless_events(this, \"#id_filter_type\"); return false;' style='color: inherit;'>연결 시작</a></span>",
        "8001": "<span class=\"label label-success\"><a href='#' onclick='filter_wireless_events(this, \"#id_filter_type\"); return false;' style='color: inherit;'>연결 성공</a></span>",
        "8002": "<span class=\"label label-danger\"><a href='#' onclick='filter_wireless_events(this, \"#id_filter_type\"); return false;' style='color: inherit;'>연결 실패</a></span>",
        "8003": "<span class=\"label label-default\"><a href='#' onclick='filter_wireless_events(this, \"#id_filter_type\"); return false;' style='color: inherit;'>연결 종료</a></span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}


function render_wireless_dashboard(){
    var wireless_chart = c3.generate({
        bindto: "#id_wireless_chart",
        data: {
            // iris data from R
            columns: [

            ],
            type : 'pie',
            onclick: function (d, i) {
                var id = d["id"];
                $("#id_filter_ssid select").val(id);
                $(".chosen-select").chosen({ width: '100%' }).trigger("chosen:updated");
                yadcf.exFilterExternallyTriggered(table_events);
                $("[href=\"#id_detail\"]").tab("show");
            }
        },
        size: { width:500, height: 350}
    });

    $.ajax({
        url: "./ajax_wireless_dashboard_events",
        success: function (data, status, xhr) {
            var returned_data = JSON.parse(data);

            var wireless_chart_data = returned_data[0];
            wireless_chart.load({
                columns: wireless_chart_data
            });

            var json = returned_data[1];

            //  최근 연결, 상태(성공,실패), SSID, BSSID, 프로토콜 종류, 암호화,
            var table = '<table class="table table-bordered table-hover">';
            table += "<thead><tr class='active'><th>최근접속</th><th>SSID</th><th>BSSID</th><th>상태</th><th>PHYType</th><th>인증알고리즘</th><th>암호알고리즘</th><tr></thead>";

            for (var key in json) {
                if (json.hasOwnProperty(key)) {

                    table += "<tr>";
                    table += "<td>" + json[key].RecentDate + "</td>";
                    table += "<td>" + wireless_dashboard_filter_apply(json[key].SSID, "#id_filter_ssid") + "</td>";
                    table += "<td>" + wireless_dashboard_filter_apply(json[key].BSSID, "#id_filter_bssid") + "</td>";
                    table += "<td>" + wireless_event_type_renderer(json[key].EventID) + "</td>";
                    table += "<td>" + json[key].PHYType + "</td>";
                    table += "<td>" + json[key].AuthenticationAlgorithm + "</td>";
                    table += "<td>" + json[key].CipherAlgorithm + "</td>";
                    table += "</tr>";
                 }
            }

            table += "</table>";

            document.getElementById("id_wireless_list").innerHTML = table;
        }
    });
}

function refresh_wireless_events() {
    axios({
        method: "get",
        url:"./ajax_wireless_detail_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "bVisible": false, "aTargets": [ 0,1 ]
                },
                {
                    "render": wireless_event_type_renderer,
                    "targets": [4]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,6,7,8,9,10,11,12]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },
                { data: "System.EventID.#text" },

                { data: "_PluginResult.ProfileName" },
                { data: "_PluginResult.SSID" },
                { data: "_PluginResult.BSSID" },
                { data: "_PluginResult.BSSType" },
                { data: "_PluginResult.PHYType" },
                { data: "_PluginResult.AuthenticationAlgorithm" },
                { data: "_PluginResult.CipherAlgorithm" },

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
                filter_default_label: "타입",
                filter_container_id: "id_filter_type",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "SSID",
                filter_container_id: "id_filter_ssid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "BSSID",
                filter_container_id: "id_filter_bssid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 12,
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
                        "id_detail_events_summary_chart", table_events, default_datetime_getter
                        , "#id_filter_localtimecreated input"
                    );
                }
            }
        );
    });
}

$(document).ready(function(){
    render_wireless_dashboard();
    refresh_wireless_events();
});