var table_security_auditing;
var table_localsessionmanager;
var table_remoteconnectionmanager;


function datatables_rdp_logon_eventid_renderer(data, type, row){
    var return_value = "-";

    var types = {
        "21": "<span class=\"label label-primary\">Logon</span>",
        "22": "<span class=\"label label-success\">Shell Start</span>",
        "23": "<span class=\"label label-danger\">Logoff</span>",
        "24": "<span class=\"label label-danger\">Disconnect</span>",
        "25": "<span class=\"label label-success\">Reconnect</span>",

        "4624": "<span class=\"label label-primary\">Logon</span>",
        "4625": "<span class=\"label label-danger\">Logon Failed</span>",

        "1149": "<span class=\"label label-primary\">Logon</span>"
    };

    if (data in types){
        return_value = types[data];
    }

    return return_value
}

function _flag_resolver(node_element){
    return '/static/vendors/country_flags/' + node_element._private.data.country + '.png';
}

function _color_resolver(node_element){
    var return_value = "#ebb";

    var colors = {
        "LOCAL": "#fff",
        "KP": "#f33",
        "KR": "#bbb",
        "": "#ddd",
        "-": "#ddd",
        undefined: "#ddd"
    };

    if (node_element._private.data.country in colors){
        return_value = colors[node_element._private.data.country];
    }

    if ("127.0.0.1" === node_element._private.data.id){
        return_value = "#f33";
    }

    return return_value;
}

function find_and_apply_filter(target_table, filter_selector, value){
    var found_value = false;

    $(filter_selector + " option").each(function(){
        if (value === this.value){
            found_value = true;
            return false;
        }
    });

    if(found_value){
        $(filter_selector).val(value);
        yadcf.exFilterExternallyTriggered(target_table);
    }

    return found_value;
}

function init_network_graph(data){
    var cy = cytoscape({
        container: document.getElementById('cy'), // container to render in
        elements: data,
        style: [
            {
                selector: 'node',
                style: {
                    'background-image': _flag_resolver,
                    'background-color': _color_resolver,
                    'border-width': 1,
                    'border-color': '#888',
                    'text-outline-width': 1,
                    'text-outline-color': '#fff',
                    'shape':'roundrectangle',
                    'label': 'data(id)'
                }
            },

            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#ddd',
                    'curve-style': 'bezier',
                    'target-arrow-color': '#ddd',
                    'target-arrow-shape': 'triangle'
                }
            }
        ],

        layout: {
            name: 'cose',
            idealEdgeLength: 150,
            nodeOverlap: 40
        }
    });

    cy.on('click', 'node', function(event){
        var text = "";
        var node_id = event.target.id();
        var type = event.target._private.data.type;
        var filter_fieldname = null;
        var filter_select_tag_selector = null;

        switch (type){
            case "remote":
                filter_fieldname = "ipaddress";
                break;

            case "computer":
                filter_fieldname = "computer";
                break;

            default:
                return false;
        }

        filter_select_tag_selector = "#id_filter_security_auditing"+ "_" + filter_fieldname + " select";
        if(find_and_apply_filter(table_security_auditing, filter_select_tag_selector, node_id)){
            text = text + "Security-Auditing : " + table_security_auditing.rows({filter: 'applied'}).count();
        }else{
            text = text + "Security-Auditing : 없음";
        }

        filter_select_tag_selector = "#id_filter_localsessionmanager"+ "_" + filter_fieldname + " select";
        if(find_and_apply_filter(table_localsessionmanager, filter_select_tag_selector, node_id)){
            text = text + "<br>LocalSessionManager : " + table_localsessionmanager.rows({filter: 'applied'}).count();
        }else{
            text = text + "<br>LocalSessionManager : 없음";
        }

        filter_select_tag_selector = "#id_filter_remoteconnectionmanager"+ "_" + filter_fieldname + " select";
        if(find_and_apply_filter(table_remoteconnectionmanager, filter_select_tag_selector, node_id)){
            text = text + "<br>RemoteConnectionManager : " + table_remoteconnectionmanager.rows({filter: 'applied'}).count();
        }else{
            text = text + "<br>RemoteConnectionManager : 없음";
        }

        text = text + "<br>(상세 내용은 각 탭 참조)";

        $(".chosen-select").chosen({ width: '100%' }).trigger("chosen:updated");

        $.toast({
            heading: "'" + event.target.id() + "' 필터링 결과",
            text: text,
            stack: false,
            hideAfter: 10000,
            position: 'bottom-right',
            icon: 'info'
        });
    });

    // the default values of each option are outlined below:
    var defaults = {
        zoomFactor: 0.05, // zoom factor per zoom tick
        zoomDelay: 45, // how many ms between zoom ticks
        minZoom: 0.1, // min zoom level
        maxZoom: 10, // max zoom level
        fitPadding: 50, // padding when fitting
        panSpeed: 10, // how many ms in between pan ticks
        panDistance: 10, // max pan distance per tick
        panDragAreaSize: 75, // the length of the pan drag box in which the vector for panning is calculated (bigger = finer control of pan speed and direction)
        panMinPercentSpeed: 0.25, // the slowest speed we can pan by (as a percent of panSpeed)
        panInactiveArea: 8, // radius of inactive area in pan drag box
        panIndicatorMinOpacity: 0.5, // min opacity of pan indicator (the draggable nib); scales from this to 1.0
        zoomOnly: false, // a minimal version of the ui only with zooming (useful on systems with bad mousewheel resolution)
        fitSelector: undefined, // selector of elements to fit
        animateOnFit: function(){ // whether to animate on fit
            return false;
        },
        fitAnimationDuration: 1000, // duration of animation on fit

        // icon class names
        sliderHandleIcon: 'fa fa-minus',
        zoomInIcon: 'fa fa-plus',
        zoomOutIcon: 'fa fa-minus',
        resetIcon: 'fa fa-expand'
    };

    cy.panzoom(defaults);
}

function refresh_directred_graph(){
    axios({
        method: "get",
        url: "./ajax_rdp_directed_graph",
        responseType: "json"
    }).then(function(response){
        $("#cy").text("");
        init_network_graph(response.data);
        $(window).resize(function(){
            console.log("window has been resized");
            // cytoscape($("cy")).resize();
        })
    }).catch(function(error){
        console.log(error);
    });
}

function refresh_rdp_security_auditing() {
    axios({
        method: "get",
        url:"./ajax_events_security_auditing",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_security_auditing = $("#id_table_security_auditing").DataTable({
            columnDefs: [
                {
                    "render": datatables_rdp_logon_eventid_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7,8,9]
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
                { data: "_PluginOutput.IpAddress" },
                { data: "_PluginOutput.Country" },
                { data: "_PluginOutput.TargetDomainName" },
                { data: "_PluginOutput.TargetUserName" },

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

        yadcf.init(table_security_auditing,
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
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "원격지 IP",
                filter_container_id: "id_filter_security_auditing_ipaddress",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "국가",
                filter_container_id: "id_filter_security_auditing_country",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "도메인",
                filter_container_id: "id_filter_security_auditing_domain",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 8,
                filter_type: "multi_select",
                filter_default_label: "사용자",
                filter_container_id: "id_filter_security_auditing_username",
                style_class: "form-control chosen-select",
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
                        "id_security_auditing_summary_chart", table_security_auditing, default_datetime_getter
                        , "#id_filter_security_auditing_localtimecreated input"
                    );
                }
            }
        );
    });
}

function refresh_rdp_localsessionmanager() {
    axios({
        method: "get",
        url:"./ajax_events_localsessionmanager",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_localsessionmanager = $("#id_table_localsessionmanager").DataTable({
            columnDefs: [
                {
                    "render": datatables_rdp_logon_eventid_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7,8,9]
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
                { data: "UserData.EventXML.Address.#text" },
                { data: "_PluginOutput.Country" },
                { data: "UserData.EventXML.User.#text" },
                { data: "UserData.EventXML.SessionID.#text" },

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

        yadcf.init(table_localsessionmanager,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_localsessionmanager_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_localsessionmanager_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_localsessionmanager_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "원격지 IP",
                filter_container_id: "id_filter_localsessionmanager_ipaddress",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "국가",
                filter_container_id: "id_filter_localsessionmanager_country",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "사용자",
                filter_container_id: "id_filter_localsessionmanager_username",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number: 9,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_localsessionmanager_localtimecreated",
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
                        "id_localsessionmanager_summary_chart", table_localsessionmanager, default_datetime_getter
                        , "#id_filter_localsessionmanager_localtimecreated input"
                    );
                }
            }
        );
    });
}

function refresh_rdp_remoteconnectionmanager() {
    axios({
        method: "get",
        url:"./ajax_events_remoteconnectionmanager",
        responseType: "json"
    }).then(function(response){
        var events = response.data;

        table_remoteconnectionmanager = $("#id_table_remoteconnectionmanager").DataTable({
            columnDefs: [
                {
                    "render": datatables_rdp_logon_eventid_renderer,
                    "targets": [3]
                },
                {
                    "render": datatables_detail_link_renderer,
                    "targets": [0,1,2,4,5,6,7,8,9]
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
                { data: "UserData.EventXML.Param3.#text" },
                { data: "_PluginOutput.Country" },
                { data: "UserData.EventXML.Param2.#text" },
                { data: "UserData.EventXML.Param1.#text" },
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

        yadcf.init(table_remoteconnectionmanager,
            [{
                column_number: 0,
                filter_type: "multi_select",
                filter_default_label: "이벤트 파일",
                filter_container_id: "id_filter_remoteconnectionmanager_source",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 2,
                filter_type: "multi_select",
                filter_default_label: "이벤트 ID",
                filter_container_id: "id_filter_remoteconnectionmanager_eventid",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 4,
                filter_type: "multi_select",
                filter_default_label: "컴퓨터",
                filter_container_id: "id_filter_remoteconnectionmanager_computer",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 5,
                filter_type: "multi_select",
                filter_default_label: "원격지 IP",
                filter_container_id: "id_filter_remoteconnectionmanager_ipaddress",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 6,
                filter_type: "multi_select",
                filter_default_label: "국가",
                filter_container_id: "id_filter_remoteconnectionmanager_country",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false,
                filter_match_mode: 'exact'
            },
            {
                column_number : 7,
                filter_type: "multi_select",
                filter_default_label: "도메인",
                filter_container_id: "id_filter_remoteconnectionmanager_domain",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number : 8,
                filter_type: "multi_select",
                filter_default_label: "사용자",
                filter_container_id: "id_filter_remoteconnectionmanager_username",
                style_class: "form-control chosen-select",
                filter_reset_button_text: false
            },
            {
                column_number: 9,
                filter_type: "range_date",
                datepicker_type: 'bootstrap-datetimepicker',
                date_format: 'YYYY-MM-DD',
                filter_container_id: "id_filter_remoteconnectionmanager_localtimecreated",
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
                        "id_remoteconnectionmanager_summary_chart", table_remoteconnectionmanager, default_datetime_getter
                        , "#id_filter_remoteconnectionmanager_localtimecreated input"
                    );
                }
            }
        );
    });
}

$(document).ready(function () {
    refresh_directred_graph();

    refresh_rdp_security_auditing();
    refresh_rdp_localsessionmanager();
    refresh_rdp_remoteconnectionmanager();
});