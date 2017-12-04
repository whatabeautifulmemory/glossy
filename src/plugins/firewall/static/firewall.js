var table_list;
var table_events;

function datatables_firewall_protocol_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "TCP": "<span class=\"label label-info\">TCP</span>",
        "UDP": "<span class=\"label label-warning\">UDP</span>",
        "ALL": "<span class=\"label label-default\">ALL</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}
function datatables_firewall_action_type_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "통과": "<span class=\"label label-warning\">통과</span>",
        "허용": "<span class=\"label label-success\">허용</span>",
        "거부": "<span class=\"label label-danger\">거부</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value;
}

function render_firewall_dashboard(){

    $.ajax({
        url: "./ajax_firewall_status_events",
        success: function (data, status, xhr) {
            var returned_data = JSON.parse(data);


            var network_profile = returned_data[0];


            var firewall_on = "<img src='./static/images/Firewall_ON_128.png' />";
            var firewall_off = "<img src='./static/images/Firewall_OFF_128.png' />";


            document.getElementById("private_status").innerHTML = returned_data[2] == "01000000" ? firewall_on : firewall_off ;
            document.getElementById("public_status").innerHTML = returned_data[3] == "01000000" ? firewall_on : firewall_off ;
            //document.getElementById("domain_status").innerHTML = returned_data[3] == "01000000" ? firewall_on : firewall_off ;

            // 활성화된 프로파일 표시

            if (network_profile[0] != "Disconnected") {
                //document.getElementById("private_status").style.backgroundColor="red";
                document.getElementById("private_network").innerHTML = "<span class=\"label label-success label-large\">"+network_profile[0]+" Connected</span>";
            }
            else {
                document.getElementById("private_network").innerHTML = "<span class=\"label label-danger label-large\">Disconnected</span>";
            }
            if (network_profile[1] != "Disconnected") {
                //document.getElementById("private_status").style.backgroundColor="red";
                document.getElementById("public_network").innerHTML = "<span class=\"label label-success label-large\">"+network_profile[1]+" Connected</span>";
            }
            else {
                document.getElementById("public_network").innerHTML = "<span class=\"label label-danger label-large\">Disconnected</span>";
            }
        }
    });

}
function refresh_firewall_list() {

    axios({
        method: "get",
        url:"./ajax_firewall_list_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_list = $("#id_table_list").DataTable({
            columns: [
                { data: "RuleName" },
                { data: "Action" },
                { data: "Direction" },
                { data: "ApplicationPath" },
                { data: "Protocol" },
                { data: "LocalAddresses" },
                { data: "LocalPorts" },
                { data: "RemoteAddresses" },
                { data: "RemotePorts" }
            ],
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

        // yadcf.init(table_list,
        //     [{
        //         column_number: 0,
        //         filter_type: "text",
        //         filter_container_id: "id_filter_source",
        //         style_class: "form-control",
        //         filter_reset_button_text: false
        //     },
        //     {
        //         column_number : 1,
        //         filter_type: "multi_select",
        //         filter_default_label: "--------",
        //         filter_container_id: "id_filter_provider",
        //         style_class: "form-control chosen-select",
        //         filter_reset_button_text: false
        //     },
        //     {
        //         column_number : 2,
        //         filter_type: "multi_select",
        //         filter_default_label: "--------",
        //         filter_container_id: "id_filter_eventid",
        //         style_class: "form-control chosen-select",
        //         filter_reset_button_text: false,
        //         filter_match_mode: 'exact'
        //     },
        //     {
        //         column_number : 3,
        //         filter_type: "multi_select",
        //         filter_default_label: "--------",
        //         filter_container_id: "id_filter_status",
        //         style_class: "form-control chosen-select",
        //         filter_reset_button_text: false
        //     },
        //     {
        //         column_number : 4,
        //         filter_type: "multi_select",
        //         filter_default_label: "--------",
        //         filter_container_id: "id_filter_computer",
        //         style_class: "form-control chosen-select",
        //         filter_reset_button_text: false,
        //         filter_match_mode: 'exact'
        //     },
        //     {
        //         column_number: 5,
        //         filter_type: "range_date",
        //         datepicker_type: 'bootstrap-datetimepicker',
        //         date_format: 'YYYY-MM-DD',
        //         filter_container_id: "id_filter_localtimecreated",
        //         filter_plugin_options: {
        //             showTodayButton: true,
        //             showClear: true
        //         },
        //         filter_reset_button_text: false
        //     }],
        //     {
        //         externally_triggered: true,
        //         onInitComplete: function(){
        //             $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });
        //         }
        //     }
        // );
    });
}


function refresh_firewall_events() {
    axios({
        method: "get",
        url:"./ajax_firewall_detail_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "bVisible": false, "aTargets": [ 0,1]
                },
                {
                    "render": datatables_firewall_protocol_type_renderer,
                    "targets": [9]
                },
                {
                    "render": datatables_firewall_action_type_renderer,
                    "targets": [6]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7,8,9,10,11,12,13,14,15]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },
                { data: "_Metadata.LocalTimeCreated" },
                { data: "_PluginResult.RuleName" },
                { data: "_PluginResult.Action" },
                { data: "_PluginResult.Direction" },
                { data: "_PluginResult.ApplicationPath" },
                { data: "_PluginResult.Protocol" },
                { data: "_PluginResult.LocalAddresses" },
                { data: "_PluginResult.LocalPorts" },
                { data: "_PluginResult.RemoteAddresses" },
                { data: "_PluginResult.RemotePorts" },
                { data: "_PluginResult.Status" },
                { data: "_PluginResult.ModifyingApplication" }

            ],
            order: [[ 4, "desc" ]],
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
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "작업",
                filter_container_id: "id_filter_action",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "방향",
                filter_container_id: "id_filter_direction",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 9,
                filter_type: "multi_select",
                filter_default_label: "프로토콜",
                filter_container_id: "id_filter_protocol",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "이름",
                filter_container_id: "id_filter_rule_name",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 15,
                filter_type: "multi_select",
                filter_default_label: "수정프로그램",
                filter_container_id: "id_filter_modifying_application",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number: 4,
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
    render_firewall_dashboard();
    refresh_firewall_events();
    refresh_firewall_list();
});