$("#search").on("input", function () {
    // console.log(this.value);
    $.ajax({
        type: "GET",
        url: "/search-word",
        data: { word: this.value },
        success: function(msg){
            console.log("Данные:" + msg);
        }
    });
});

