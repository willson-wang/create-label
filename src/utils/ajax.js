export function utilPostAjax(url, data, successFn) {
    $.ajax({
        type: "POST",
        url: url,
        data: data,
        dataType: "json",
        beforeSend: function() {},
        success: successFn,
        error: function() {
            console.log("响应失败");
        },
    });
}
