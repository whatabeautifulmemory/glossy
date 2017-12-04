var table_events;
var table_statistics;

function refresh_events(){
    axios({
        method: "get",
        url:"./ajax_events",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_events = $("#id_table_events").DataTable({
            columnDefs: [
                {
                    "render": datatables_level_renderer,
                    "targets": [0]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [1,2,3,4,5]
                }
            ],
            columns: [
                { data: "level" },
                { data: "source" },
                { data: "provider" },
                { data: "event_id" },
                { data: "computer" },
                { data: "localtimecreated" }
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
            bDestroy: true,

            initComplete: function (settings, json) {

            }
        });

        yadcf.init(table_events,
            [{
                column_number: 1,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "Provider",
                filter_container_id: "id_filter_provider",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 3,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
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
                    // workaround for new filter_default_label item
                    // remove_yadcf_first_option_item("#id_detail .yadcf-filter-wrapper select");

                    $(".chosen-select").chosen({ width: '100%', hide_results_on_select: false });

                    create_summary_chart(
                        "id_summary_chart", table_events, function(row){ return row.localtimecreated; }
                        , "#id_filter_localtimecreated input"
                    );
                }
            }
        );
    });
}

function filter_show_all_events(tag, target_input_selector){
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

function datatables_show_all_statistics_filter_apply(data, target_id){
    return "<a href='#' onclick='filter_show_all_events(this, \""+ target_id +"\");return false;'>" + data + "</a>";
}

function refresh_statistics(){
    axios({
        method: "get",
        url:"./ajax_statistics",
        responseType: "json"
    }).then(function(response){
        var statistics = response.data;

        table_statistics = $("#id_table_statistics").DataTable({
            columnDefs: [
                {
                    "render": function (data, type, row) {
                        return datatables_show_all_statistics_filter_apply(data, "#id_filter_computer");
                    },
                    "targets": [0]
                },
                {
                    "render": function (data, type, row) {
                        return datatables_show_all_statistics_filter_apply(data, "#id_filter_provider");
                    },
                    "targets": [1]
                },
                {
                    "render": function (data, type, row) {
                        return datatables_show_all_statistics_filter_apply(data, "#id_filter_eventid");
                    },
                    "targets": [2]
                },
                {
                    "render": function (data, type, row){
                        return numeral(data).format("0,0");
                    },
                    "targets": [3]
                }
            ],
            columns: [
                { data: "computer_name" },
                { data: "provider_name" },
                { data: "event_id" },
                { data: "count" }
            ],
            order: [[ 3, "desc" ]],
            data: statistics,
            autoWidth: false,
            scrollX: false,
            deferRender: true,

            lengthMenu: [[10, 15, 25, 50, -1], [10, 15, 25, 50, "All"]],
            dom: 'frtipl',
            bDestroy: true
        });
    });
}

$(document).ready(function(){
    refresh_statistics();
    refresh_events();

    $(".yadcf-filter-range").addClass("form-control");
});