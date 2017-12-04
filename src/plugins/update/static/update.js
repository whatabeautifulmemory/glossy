var table_update_w7;
var table_update_w10;


function datatables_update_default_renderer(data, type, row){
    return data||"-"
}

function datatables_update_kb_search_renderer(data, type, row){
    var kb_search_url = "https://www.catalog.update.microsoft.com/Search.aspx?q=" + data;
    return "<a href='#' onclick='window.open(\""+kb_search_url+"\");return false;'><i class=\"fa fa-external-link\" aria-hidden=\"true\"></i>\n" + data + "</a>";
}

function render_update_w7_events() {
    axios({
        method: "get",
        url:"./ajax_win7_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_w7").DataTable({
            columnDefs: [
                {
                    "render": datatables_update_kb_search_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_update_default_renderer,
                    "targets": [0,1,2,4,5]
                }
            ],
            columns: [
                { data: "_PluginResult.Date" },
                { data: "_PluginResult.Product" },
                { data: "_PluginResult.Platform" },
                { data: "_PluginResult.Article" },
                { data: "_PluginResult.Download" },
                { data: "_PluginResult.UpdateDate" }
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
    });
}

function render_update_w10_events() {
    axios({
        method: "get",
        url:"./ajax_win10_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_w10").DataTable({
            columnDefs: [
                {
                    "render": datatables_update_kb_search_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_update_default_renderer,
                    "targets": [0,1,2,4,5]
                }
            ],
            columns: [
                { data: "_PluginResult.Date" },
                { data: "_PluginResult.Product" },
                { data: "_PluginResult.Platform" },
                { data: "_PluginResult.Article" },
                { data: "_PluginResult.Download" },
                { data: "_PluginResult.UpdateDate" }
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
    });
}



function refresh_update_detail_events(){
    axios({
        method: "get",
        url:"./ajax_update_detail_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "bVisible": false, "aTargets": [ 0,1,2 ]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,3,4,5]
                }
            ],
            columns: [
                { data: "_Metadata.Source" },
                { data: "System.Provider.@Name" },
                { data: "System.EventID.#text" },
                { data: "System.Computer.#text" },

                { data: "_PluginResult.updateTitle" },

                { data: "_Metadata.LocalTimeCreated" }
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
                filter_default_label: "업데이트명",
                filter_container_id: "id_filter_update_title",
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
    render_update_w7_events();

    render_update_w10_events();
    refresh_update_detail_events();
});