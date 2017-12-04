var table_account_list;
var table_account_detail;

function render_account_list() {
    axios({
        method: "get",
        url:"./ajax_account_list_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_account_list = $("#id_table_list").DataTable({
            columnDefs: [
                {
                    "render": function(data, type, row){ return (data||"-")},
                    "targets": [0,1,2,3,4,5,6]
                }
            ],
            columns: [
                { data: "CreateDate" },
                { data: "TargetUserName" },
                { data: "TargetDomainName" },
                { data: "PasswordChangeDate" },
                { data: "RecentLogonDate" },
                { data: "IsDeleted" },
                { data: "DeleteDate" }
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
        //
        // yadcf.init(table_events,
        //     [{
        //         column_number: 0,
        //         filter_type: "text",
        //         filter_container_id: "id_filter_source",
        //         style_class: "form-control",
        //         filter_reset_button_text: false
        //     },
        //     {
        //         column_number : 2,
        //         filter_type: "multi_select",
        //         filter_default_label: "--------",
        //         filter_container_id: "id_filter_eventid",
        //         style_class: "form-control",
        //         filter_reset_button_text: false
        //     },
        //     {
        //         column_number : 3,
        //         filter_type: "multi_select",
        //         filter_default_label: "--------",
        //         filter_container_id: "id_filter_computer",
        //         style_class: "form-control",
        //         filter_reset_button_text: false
        //     },
        //     {
        //         column_number: 8,
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
        //     {externally_triggered: true}
        // );
    });
}

function render_account_detail() {
        axios({
        method: "get",
        url:"./ajax_account_detail_events",
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
                    "targets": [0,1,2,3,4,5,6]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginResult.Status" },
                { data: "_PluginResult.TargetUserName" },

                { data: "_Metadata.LocalTimeCreated" }
            ],
            order: [[ 6, "desc" ]],
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
                filter_default_label: "상태",
                filter_container_id: "id_filter_status",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "사용자명",
                filter_container_id: "id_filter_username",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number: 6,
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
    render_account_list();
    render_account_detail();
});