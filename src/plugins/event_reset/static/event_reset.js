var table_events;

function render_event_reset_events() {
    axios({
        method: "get",
        url:"./ajax_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,5,6,7,8]
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
                { data: "System.Computer.#text" },

                { data: "_PluginOutput.ClearedEventLog" },
                { data: "UserData.LogFileCleared.SubjectUserName.#text" },
                { data: "UserData.LogFileCleared.SubjectDomainName.#text" },
                { data: "UserData.LogFileCleared.BackupPath.#text" },

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

$(document).ready(function(){
    render_event_reset_events();
});