
function glossy_rpc(request_parameters){
    var request_data = {
        id: 1,
        method: request_parameters.method
    };

    if(null !== request_parameters.params){
        request_data.params = request_parameters.params;
    }

    $.ajax({
        async: request_parameters.async,
        type: "POST",
        url: "/api",
        contentType: "application/json",

        data: JSON.stringify(request_data),

        success: request_parameters.on_success,
        error: request_parameters.on_error
    });
}


function reset_all() {
    var message = "";
    var type = "";

    swal({
            title: "초기화 하시겠습니까?",
            text: "현재 등록된 모든 EVTX 파일, 인덱싱된 이벤트, 임시 디렉토리의 EVTX 파일들이 사라집니다. 계속하시겠습니까?",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "No",
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes"
        }).then(function (is_confirmed) {
            glossy_rpc({
                async: false,
                method: "reset_all",
                params: null,
                on_success: function (data, text_status, xhr) {
                    message = "초기화 완료!";
                    type = "success";

                    if ("function" === (typeof refresh_sources)){
                        refresh_sources();
                    }
                },
                on_error: function (data, text_status, xhr) {
                    message = "초기화 실패!";
                    type = "error";
                }
            });

            swal("초기화", message, type);
        });
}

function process_source() {
    var message = "";
    var type = "";

    glossy_rpc({
        async: true,
        method: "process_sources",
        on_success: function (data, text_status, xhr) {
            message = "현재 등록된 파일들을 인덱싱 합니다. 잠시만 기다려 주십시오...";
            type = "success";
            swal("EVTX 인덱싱", message, type);
        },
        on_error: function (request, status, error) {
            message = "Error!";
            type = "error";
            swal("EVTX 인덱싱", message, type);
        }
    });
}

function refresh_current_status(){
    axios({
        method: "post",
        url: "/api",
        responseType: "json",
        data: {
            id: 1,
            method: "get_current_status"
        }
    }).then(function(response){
        $(".status_sources").text(response.data.result.count_sources);

        $(".status_processed").text(response.data.result.processed || "-");
        $(".status_total").text(response.data.result.total || "-");

        $(".status_events").text(
            numeral(response.data.result.count_events).format("0,0")
        );
    }).catch(function(error){
        console.log(error);
    });
}

function add_windir_extx(){
    var _add_windir_evtx = function(){
        $.ajax({
            type: "POST",
            url: "/api",
            contentType: "application/json",
            data: JSON.stringify({
                id: 1,
                method: "add_source",
                params: ["c:\\windows\\system32\\winevt\\logs\\"]
            }),
            success: function(data, text_status, xhr){
                swal("로컬 EVTX 추가", "로컬 EVTX 파일 추가 성공!", "success");

                if ("function" === (typeof refresh_sources)){
                    refresh_sources();
                }
            }
        });
    };

    if(-1 === navigator.platform.indexOf("Win")){
        swal({
            title: "미지원 OS",
            text: "현재 사용중인 운영체제는 Windows가 아닌 것으로 보여집니다. 계속하시겠습니까?",
            type: "warning",
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes",
            showCancelButton: true,
            cancelButtonText: "No"
        }).then(function (is_confirmed) {
            if(is_confirmed){
                _add_windir_evtx();
            }
        });
    }else{
        _add_windir_evtx();
    }


}

var app_dialog_detail = new Vue({
    el: "#id_dialog_detail",
    data: {
        event: ''
    },
    methods: {
        get_event: function(_id){
            axios({
                method: "post",
                url: "/api",
                responseType: "json",
                data: {
                    id: 1,
                    method: "get_events",
                    params: [_id]
                }
            }).then(function(response){
                var editor = ace.edit("id_json_editor");
                editor.setTheme("ace/theme/tomorrow");
                editor.getSession().setMode("ace/mode/json");
                editor.setValue(JSON.stringify(response.data.result[0], null, 4));
                editor.clearSelection();

                $("#id_dialog_detail").modal("show");
            }).catch(function(error){
                console.log(error);
            });
        }
    }
});

function setup_evtx_uploader(){
    $("#id_dialog_upload_source_form").fileupload({
        dataType: 'json',
        acceptFileTypes: /(\.|\/)(evtx)$/i,
        sequentialUploads: true,
        dropzone: $("#id_dropzone"),
        limitConcurrentUploads: 1,

        add: function (e, data) {
            console.log("fileupload-add callback", data.files[0]);
            data.url = "/upload/?filename=" + encodeURI(data.files[0].webkitRelativePath || data.files[0].name);
            data.submit();

            var uploaded_file_item = $('<li/>').appendTo('#id_dialog_upload_source_form ul');
            uploaded_file_item.text(data.files[0].name);
        },

        done: function(e, data){
            if ("function" === (typeof refresh_sources)){
                refresh_sources();
            }
        }
    }).on("fileuploadprogressall", function(e, data){
        var progress = parseInt(data.loaded / data.total * 100, 10);
        var progress_tag = $('#id_dialog_upload_source_progress .progress-bar');

        if(progress_tag){
            progress_tag.css('width', progress + '%');
            progress_tag.text(progress + "%");

            if(100 === progress){
                progress_tag.removeClass("active");
            }
        }
    });
}

function default_datetime_getter(row){
    return row._Metadata.LocalTimeCreated;
}

function sort_object_by_key(object){
    var return_value = {};

    Object.keys(object)
      .sort()
      .forEach(function(v, i) {
          // console.log(v, object[v]);
          return_value[v] = object[v]
       });

    return return_value;
}

function get_summary_data_from_datatables(datatables_table_object, datetime_getter){
    var statistics = {};
    var datas = datatables_table_object.rows( { filter : 'applied'} ).data();

    console.log("get_summary_data_from_datatables started at " + new Date());

    datas.each(function(row, idx){
        var datetime_string = datetime_getter(row);

        // 정석이지만 느리다
        // var date_string = moment(datetime_string).format("YYYY-MM-DD");

        // 어차피 포매팅 되어서 나오기에 이게 더 빠름
        var date_string = datetime_string.substring(0, 10);

        if (date_string in statistics){
            statistics[date_string] = statistics[date_string] + 1;
        } else{
            statistics[date_string] = 1;
        }
    });

    var sorted_statistics = sort_object_by_key(statistics);

    console.log("get_summary_data_from_datatables finished at " + new Date());

    return sorted_statistics;
}

function update_summary_chart(chart_object, datatables_table_object, datetime_getter){
    var summary_data = get_summary_data_from_datatables(datatables_table_object, datetime_getter);
    var axis_x = Object.keys(summary_data);
    var axis_y = Object.values(summary_data);

    chart_object.setOption({
        xAxis: {
            data: axis_x
        },

        series: [{
            data: axis_y
        }],

        dataZoom: [{
            start: 0,
            end: 100
        }]
    });
}

function create_summary_chart(target_id, datatables_table_object, datetime_getter, datetime_filter_input_selector){
    var created_chart = echarts.init(document.getElementById(target_id), "wonderland");

    var option = {
        tooltip: {
            trigger: 'axis',
            position: function (pt) {
                return [pt[0], '10%'];
            }
        },
        grid: {
            // x: 40,
            y: 10
            // x2: 40,
        //     y2: 70
        },
        xAxis: {
            type: 'category',
            boundaryGap: true,
            data: []
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%']
        },
        dataZoom: [{
            type: 'inside'
        }, {
            // start: 0,
            // end: 10,
            handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            handleSize: '80%'
        }],
        series: [
            {
                name:'Events',
                type:'bar',
                smooth:true,
                symbol: 'none',
                sampling: 'average',
                data: []
            }
        ]
    };
    created_chart.setOption(option);

    update_summary_chart(created_chart, datatables_table_object, datetime_getter);

    created_chart.on('click', function (params) {
        $(datetime_filter_input_selector).each(function(idx, input_object){
            $(input_object).data("DateTimePicker").date(params.name);
        });

        yadcf.exFilterExternallyTriggered(datatables_table_object);
    });

    created_chart.on('dataZoom', function (params) {
        var axis = created_chart.getModel().option.xAxis[0];
        var start_time = axis.data[axis.rangeStart];
        var end_time = axis.data[axis.rangeEnd];

        $($(datetime_filter_input_selector)[0]).data("DateTimePicker").date(start_time);
        $($(datetime_filter_input_selector)[1]).data("DateTimePicker").date(end_time);
    });

    datatables_table_object.on('search.dt', function () {
        console.log("filter applied");
        update_summary_chart(created_chart, datatables_table_object, datetime_getter);
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        created_chart.resize();
    });

    $(window).on('resize', function (e) {
        created_chart.resize();
    });

    return created_chart;
}

$(document).ready(function () {
    setup_evtx_uploader();
});