
class angularJS{
    constructor(module){
        //this.controller = controller;
        this.module = module;
        this.app = angular.module(this.module,[]);
        //var app = angular.module(this.module,[]);
        this.app.filter('Delete',function($sce){
            return function(path,id){
                return $sce.trustAsHtml(Validator.deleteButton(path,id));
            };
        });
        
        this.app.filter('ViewFile',function($sce){
            return function(item){
                return $sce.trustAsHtml(Validator.viewFile(item));
            };
        });
        
        this.app.filter('EditFile',function($sce){
            return function(item){
                return $sce.trustAsHtml(Validator.editFileButton(item));
            };
        });
        
        this.app.filter('ConvertText',function($sce){
            return function(item){
                return $sce.trustAsHtml(Editor.converter(item));
            };
        });
        
        this.app.filter('ReadMoreConvertText',function($sce){
            return function(item){
                return $sce.trustAsHtml(Validator.readMoreText(Editor.converter(item)));
            };
        });
        
        this.app.filter('ReadMoreEditConvertText',function($sce){
            return function(item,column,path,id){
                return $sce.trustAsHtml(Validator.readMoreEditEditorButton(item,id,path,column));
            };
        });
        
        this.app.filter('EditConvertText',function($sce){
            return function(item,column,path,id){
                return $sce.trustAsHtml(Validator.editEditorButton(item,id,path,column));
            };
        });
        
        this.app.filter('EditText',function($sce){
            return function(item, column, path, id){
                return $sce.trustAsHtml(Validator.editButton(column,item,path,id));
            };
        });
        this.app.filter('EditSelect',function($sce){
            return function(item, column, path, id,options){
                return $sce.trustAsHtml(Validator.editButton(column,item,path,id,'select',options));
            };
        });
        
        this.app.filter('EditTextArea',function($sce){
            return function(item, column, path, id){
                return $sce.trustAsHtml(Validator.editButton(column,item,path,id,'textarea'));
            };
        });
        this.app.filter('unsafe', function($sce){
            return function(val){
                return $sce.trustAsHtml(val);
            };
        });
    }
    moduleOperation(url, controller, header = {'Content-Type':'application/x-www-form-urlencoded'}){
        this.app.controller(controller,function($scope,$http){
            $http({
                method: 'GET',
                url: url,
                headers: header,
                transformRequest: function(obj){
                    var str = [];
                    for(var p in obj)
                        str.push(encodeURIComponent(p)+"="+encodeURIComponent(obj[p]));
                    return str.join("&");
                }
            }).then(function (response){
                $(`.${controller}-data`).removeClass('hidden');
                $(`.${controller}-loader`).hide();
                if (response.data.message.toUpperCase() === "ACCESS DENIED") {
                    alert(response.data.message);
                    Validator.logout();
                    return false;
                }
                //alert(JSON.stringify(response.data));
                $scope.data = response.data.data;
                
            });
        });
        
    }
    
}


class Request{
    
    
    constructor(url, data, type= "GET", headers = { }) {
        this.url = url;
        this.headers = headers;
        this.data = data;
        this.type = type;
    }
    
    setOperation(url, data, type= "GET", headers = { }){
        this.url = url;
        this.headers = headers;
        this.data = data;
        this.type = type;
    }
    
    async send(){
        let result = '';
        await $.ajax({
            url: this.url,
            data: this.data, //{sign: 'hello'}
            type: this.type,
            headers: this.headers, //{'token':'my token'}
            error: function(xhr, status, error) {
              alert(status + ": " + error + " " + xhr.responseText);
            },
            success: data => {
                result = JSON.parse(data);  
            }
        });
        return this.verifyRequest(result);
    }
    
    verifyRequest(result){
        if (result.success == false) {
            if (result.message.toUpperCase() === "ACCESS DENIED") {
                alert(result.message);
                Validator.logout();
                return false;
            }
        }
        return result;
    }
    async upload() {
        let result = '';
        const form_data = new FormData();
        for (var key in this.data) 
            form_data.append(key, this.data[key]);
        
        await $.ajax({
            xhr: function() {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function(e) {
                    if (e.lengthComputable) {
                        const progres = document.getElementById("progressBar");
                        const editProgres = document.getElementById("editProgressBar");
                        const progressBar = editProgres ? editProgres : progres;
                        if (progressBar) {
                            progressBar.style.width = Math.ceil(e.loaded / e.total) * 100 + "%";
                            progressBar.innerHTML = Math.ceil(e.loaded / e.total) * 100 + "% completed";
                        }
                    }
                },
                false
                );
                return xhr;
            },
            cache: false,
            contentType: false,
            processData: false,
            data: form_data,
            headers: this.headers,
            url: this.url,
            type: this.type,
            error: function(xhr, status, error) {
                alert(status + ": " + error + " " + xhr.responseText);
            },
            success: function(dataX) {
                result = JSON.parse(dataX);
            }
        });
        return this.verifyRequest(result);
    }
}


class Validator{
    
    static async deleteFile($this,fileName){
        const p = $this.parentNode;
        $($this).hide();
        $(p).children('.loader').removeClass('hidden');
        const user = Validator.decodedUser();
        if (user.token !== undefined) {
            const s = new Request(`${apiURL}uploadFiles/`, {}, "DELETE",{ 'source': source, id: fileName, token: user.token });
            await s.send();
            const cert = document.getElementById('certificateFile');
            if(cert)
                cert.value = '';
            $(p).html('');
            $(p).hide();
        }
        
    }
    
    static notEmpty(item){
        if($.trim(item.value) === ''){
            return Validator.invalidOpertion(item,'Field must not be empty');
        }
        return true;
    }
    
    static maxLength(item,max=12){
        if(item.value.length > max){
            return Validator.invalidOpertion(item,'Too long. maximum character of '+max);
        }
        return true;
    }
    
    static minLength(item,min=6){
        if(item.value.length < min){
            return Validator.invalidOpertion(item,'Too small. minimum character of '+min);
        }
        return true;
    }
    
    static notMatch(item1,item2,message = "passwords does not match"){
        if(item1.value !== item2.value){
            return Validator.invalidOpertion(item2,message);
        }
        return true;
    }
    
    static upperCaseString(item){
        if(item.value.toLowerCase() === item.value){
            return Validator.invalidOpertion(item,"At least one uppercase character required");
        }
        return true;
    }
    
    static lowerCaseString(item){
        if(item.value.toUpperCase() === item.value){
            return Validator.invalidOpertion(item,"At least one lowercase character required");
        }
        return true;
    }
    
    static hasNumber(item){
        if(!/\d/.test(item.value)){
            return Validator.invalidOpertion(item,"At least one numeric character required");
        }
        return true;
    }
    
    /*static hasSpecialCharacter(item){
        if(!/[ !@#$%^&*()_+\\-=[\]{};':"\\|,.<>?/~`]/.test(item.value)){
            return Validator.invalidOpertion(item,"At least one numeric character required");
        }
        return false;
    }*/
    
    static invalidOpertion(item,message){
        item.className += ' invalid';
        const error = document.getElementById(item.id+'Error') || '';
        if(error !== ''){
            $(error).html($(error).html()+'<br>'+message);
        }
        return false;
    }
    

    
    
    static editEditor($this,id,apiLink,column){
        $("#modal-body-container").load(`${hostUrl}public/pages/textEditor/editTextEditor.php`, () => {
            _self = $this;
            const tags = `<input type='hidden' value='${id}' id='ColumnId'><input type='hidden' value='${column}' id='Column'>
                          <input type='hidden' value='${apiLink}' id='linkName'>`;
            const parentnode = $this.parentNode;
            const value = parentnode.childNodes[0].innerHTML;
            let _arr = [], del = '';
            if(value.indexOf("#mgsrc=") > -1){
                let values = value.split("#mgsrc=");
                for(var i = 0; i < values.length; i++){
                    if(i > 0 && values[i].indexOf("-#mg")){
                        let c = values[i].split("-#mg");
                        _arr.push(c[0].replace(/\'/g, ""));
                    }
                }
                for(var i = 0; i < _arr.length; i++){
                    del += `<span class='image-file'><span>#mgsrc='${_arr[i]}'-#mg</span> <i class='fa fa-times hand' onclick='removeFile(this,"${_arr[i]}")'></i></span>`;
                }
            }
            
            del += Validator.addRemoveTextFile(value,'pdf');
            del += Validator.addRemoveTextFile(value,'doc');
            del += Validator.addRemoveTextFile(value,'xls');
            
            $("#myModal").children(0).removeClass("modal-md modal-lg").addClass("modal-lg");
            $("#modal-title").html(`Edit Message ${tags}`);
            $("#editEditor").val(value);
            $("#myModal").modal("toggle");
            $("#editEditor-file-footer").append(del);
        });
    }
    
    static addRemoveTextFile(value,ext){
        let _ar = [], tooltip ='', file = '', del = '';
        let fa = "fa-file-pdf-o";
        if(ext.toLowerCase() === 'doc')
            fa = "fa-file-word-o";
        else if(ext.toLowerCase() === 'xls')
            fa = "fa-file-excel-o";
        if(value.indexOf(`-#${ext}`) > -1){
            let values = value.split(`-#${ext}`);
            for(var i = 0; i < values.length; i++){
                if(values[i].indexOf(`#${ext}`) > -1){
                    let c = values[i].split(`#${ext}`);
                    _ar.push(c[1].replace(/\'/g, ""));
                }
            }
            for(var i = 0; i < _ar.length; i++){
                tooltip = `data-container='body' data-placement='bottom' data-toggle='tooltip' title='#${ext}${_ar[i]}-#${ext}'`;
                file = `<span class='hidden'>#${ext}${_ar[i]}-#${ext}</span><i ${tooltip} class='fa ${fa}' style='font-size:40px;position: relative; bottom: -10px;'></i>`;
                del += `<span class='image-file'>${file} <i class='fa fa-times hand' onclick='removeFile(this,"${_ar[i]}")'></i></span>&nbsp;&nbsp;`;
            }
        }
        return del;
    }
    static editEditorButton(value,id,apiLink,column){
        return `<div><span class='hidden'>${value}</span><div class='inline-block'>${Editor.converter(value)}</div>
        <i class='fa fa-edit hand editEditor' onclick='Validator.editEditor(this,"${id}","${apiLink}","${column}")'></i></div>`;
    }
    static getParameter(name) {
        const url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return "";
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    static async deleteItem(path, id, $this, remove = true) {
        const con = confirm("Are you sure you want to delete this item?"),
                user = Validator.decodedUser(),
                p = $this.parentNode.parentNode;
        if (con && user.token !== undefined) {
            $this.className = "loader";
            $this.innerHTML = "";
            const s = new Request(`${apiURL}${path}/`, {}, "DELETE",{ 'source': source, id: id, token: user.token });
            let result = await s.send();
            if(result.success && remove){
                p.className = "hidden";
                //window.location.reload();
            }else{
                 $this.className = "";
                alert(result.message)
            }
           
            return result;
        }
        return false;
    }
  
    static deleteButton(path, id) {
        return `<i class='fa fa-times hand' style='color: red;' onclick="Validator.deleteItem('${path}','${id}',this)"></i>`;
    }
    static decodedUser() {
        if (!Validator.isNumber(_userToken)) {
            const token = {
                name: _userName,
                user: _userUser,
                token: _userToken,
                id: _userId
            };
            return token;
        }
        return "";
    }
    static async update($this) {
        let p = $this.parentNode,
              user = Validator.decodedUser(),
              result;
        if ($.trim(p.childNodes[0].value) !== "" && user.token !== undefined) {
            const path = p.childNodes[2].value;
            const data = {
                value: Validator.stripedtags(p.childNodes[0].value),
                column: p.childNodes[1].value,
                id: p.childNodes[3].value
            };
            p.parentNode.innerHTML = `${data.value} <span id='updating${data.column}${data.id}' class='loader'></span>`;
            const s = new Request(`${apiURL}${path}/`, data, "PUT",{ 'source': source, token: user.token });
            result = await s.send();
            if (result.data.id) {
                document.getElementById(`updating${result.data.column}${result.data.id}`).className = "fa fa-check-square-o";
            }
        }
    }
    static validateFile($self, width = 500, height = 300, maxSize = 555000){
        const error = document.getElementById('invalidError');
        error.innerHTML = '';
        if($self.files[0].type.match(/image.*/)){
            const img = new Image(), reader = new FileReader();
            reader.onload = function(e){
                img.onload = function(){
                    if(img.height !== height || img.width !== width || $self.files[0].size > maxSize){
                        error.innerHTML = `Invalid file size. Required dimensions 500x300 Max. file size 555kb`;
                    }
                };
                img.src = e.target.result;
                $('#imagePreview').html(`<img src="${e.target.result}" /><br>`);
            };
            reader.readAsDataURL($self.files[0]);
        } else error.innerHTML = 'Invalid file type';
        
    }
    static editButton(column,value,apiLink,id,type = 'text',options = "",rawValue = "",_class = '',fa = '') {
        let c = fa === "" ? "" : `<i class="fa ${fa}">&nbsp;&nbsp; </i>`;
        c += `<span class="${_class}">${value}</span>&nbsp;&nbsp;
              <i class="fa fa-edit inline-block hand" onclick="Validator.edit(this,'${column}','${apiLink}','${type}','${id}','${options}','${rawValue}')"></i>`;
        return c;
    }
    static edit($this, field, table, type = "text", id = 0, options = "", rawValue = "") {
        const p = $this.parentNode;
        let value = "";
        for (var i = 0; i < p.childNodes.length; i++) {
            if (p.childNodes[i].nodeName.toLowerCase() === "span") {
                value = p.childNodes[i].innerHTML;
                break;
            }
        }
        p.innerHTML = Validator.editorForm(field,table,id,value,type,options,rawValue);
    }
    
    static viewFile(value){
        return `<a class="hand" onclick="window.open('${value}','_blank','fullscreen=yes')">
                         <i class='fa fa-file-pdf-o text-lg'></i> View</a>`;
    }
    
    static editFileButton(value){
        let btn = Validator.viewFile(value);
        let c = `<span>${btn}</span>&nbsp;&nbsp;
              <span><i class="fa fa-edit inline-block hand" onclick="Validator.editFile(this,'${value}')"></i></span>`;
        return c;
    }
    static editFile($this,oldfile){
        const p = $this.parentNode;
        p.innerHTML = Validator.changeFile(oldfile);
    }
    static changeFile(oldfile){
        return `<span><input type="file" class="hidden changefile" id="changefile" onchange="Validator.uploadChangeFile(this,'${oldfile}');" accept="application/pdf"/>
                <label for="changefile"><i class="fa fa-upload"></i> Select File</label>
                <span class="loader hidden"></span></span>`;
    }
    
    static async uploadChangeFile($this,oldfile){
        let p = $this.parentNode,
              user = Validator.decodedUser(),
              result;
        $(p).children('.loader').removeClass('hidden');
        if($this.files[0].type === 'application/pdf'){
            const s = new Request(`${apiURL}uploadFiles/text/update/`, { uploadFile: $($this).prop('files')[0],rename:oldfile}, "POST",{ 'source': source, token: user.token });
            result = await s.upload();
            if(result.success){
                $(p).html(`<i class='fa fa-check'></i>`);
            }
        }
    }
    
    static editorForm(field,apiLink,id,value,type,options,rawValue) {
        rawValue = rawValue !== "" ? rawValue : value;
        let _type = `<input type='${type}' value='${rawValue}' class='form-control'>`;
        if (type === "textarea") 
            _type = `<textarea class='form-control'>${rawValue}</textarea>`;
        else if (type === "select") {
            _type = `<select class='form-control'>`;
            let arr = options.split(","), _o;
            for (var o of arr) {
                _o = o.indexOf("*") > -1 ? o.split("*") : [o, o.charAt(0).toUpperCase() + o.slice(1).toLowerCase()];
                _type += `<option value='${_o[0]}' `;
                _type += value == _o[1] ? ` selected='selected'>${_o[1]}</option>` : ` >${_o[1]}</option>`;
            }
            _type += `</select>`;
        }
        return `<div>${_type}<input type='hidden' value='${field}'><input type='hidden' value='${apiLink}'><input type='hidden' value='${id}'>
                <br><input type='button' value='Update' onclick='Validator.update(this)' class='btn btn-primary' ></div>`;
    }
  
    static isNumber(value){
        return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
    }
    static isKeyNumber(event){
        event = (event) ? event : window.event;
        var charCode = (event.which) ? event.which : event.keyCode;
        if(charCode > 31 && (charCode < 48 || charCode > 57))
            return false;
        return true;
    }
    static setCookie(cvalue, cname, destroy = undefined) {
        const d = new Date();
        d.setTime(d.getTime() + 60 * 60 * 1000);
        const expires = "expires=" + (destroy || d.toUTCString());
        //secure;
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    static logout() {
        Validator.setCookie("", source.replace('Source',''), "Thu, 01 Jan 1999 00:00:00 GMT");
        
        window.location.href = "?n=login";
        
    }
    
    static inputFields(arr, data = {}) {
        let valid = true;
        arr.forEach(function(val, i) {
          const elem = document.getElementById(val);
          if (!$(`#${val}`).hasClass("ignore") && $.trim(elem.value) === "") {
            elem.className += " invalid";
            valid = false;
          } else {
              if(val.toLowerCase() === 'email' && !Validator.isValidEmail(elem.value)){
                  elem.className += " invalid";
                  valid = false;
              }else data[val] = Validator.stripedtags(elem.value);
          }
        });
        return valid;
    }
    
    static isValidEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    static stripedtags(value) {
        var clean = value.replace(/<\/?[^>]+(>|$)/g, "");
        var elem = document.createElement("div");
        elem.innerHTML = clean;
        return elem.textContent || elem.innerHTML || "";
    }
    
    static doFileExist(url){
        const http = new XMLHttpRequest();
        http.open('HEAD',url,false);
        http.send();
        return http.status === 200;
    }
    
    static SelectChangePicture($this, path, size = undefined){
        if($this.files[0].type.match(/image.*/)){
            
            const reader = new FileReader();
            reader.onload = function(e){
                const img = new Image();
                if(size !== undefined){
                    img.onload = function(){
                        if(this.width !== size.width || this.height !== size.height){
                            alert(`wrong image dimensions ${this.width}x${this.height}. required size ${size.width}x${size.height}`);
                        }else{
                            $("label[for='picture']").addClass('hidden');
                            const p = $($this).parent();
                            p.children('.loader').removeClass('hidden');
                            Validator.uploadingImg(p,$this,path);
                        }
                    }
                }
                img.src = e.target.result;
                
                const parent = $this.parentNode;
                $(parent).children('img').attr('src',e.target.result);
                
                //document.getElementById(imgSrc).src = e.target.result;
            };
            reader.readAsDataURL($this.files[0]);
            return true; 
            
        }
        return false;
    }
    
    static async uploadingImg(p,file,path = 'uploadFiles'){
        const user = Validator.decodedUser();
        if(user.user !== undefined){
            const s = new Request(`${apiURL}${path}/`, { uploadFile: $(file).prop('files')[0]}, "POST",{token: user.token });
            let result = await s.upload();
            //let a = new User(user.name,user.user,user.token,user.id);

            //const result = await a.uploadFile(path, { uploadFile: $(file).prop('files')[0]});
            if(result.success && result.data !== ''){
                p.children('.loader').addClass('hidden');
                const uniqueId = "remomevePicture" + new Date().getTime();
                p.append(`<label id="${uniqueId}"><i class="fa fa-times red"></i> Remove Picture</label>`);
                $('input[type="hidden"]').removeAttr('id');
                p.children('input[type="hidden"]').attr("id","uploadFileValue").val(result.data);
                $("#"+uniqueId).on('click',function(){
                    $(this).remove();
                    $("label[for='picture']").removeClass('hidden');
                    $('#customer-picture').attr('src','');
                    const d = new Request(`${apiURL}uploadFiles/`, {}, "DELETE",{ id: result.data, token: user.token });
                    d.send();
                    p.children('input[type="hidden"]').attr("id","").val('');
                    //a.deleteFile('uploadFiles', result.data);
                });
            }
        }

   }
   
   
   
    static readMoreEditEditorButton(value,id,apiLink,column){
        let val = Validator.readMoreText(value);
        return `<div><span class='hidden'>${value}</span><div class='inline-block'>${Editor.converter(val)}</div>
        <i class='fa fa-edit hand editEditor' onclick='Validator.editEditor(this,"${id}","${apiLink}","${column}")'></i></div>`;
    }
    
    static readMoreText(value){
        let val = value;
        const values = value.split(" ");
        //alert(values.length)
        
        if(values.length > 7){
            values.splice(6,0,'<div class="readMore hidden">'); 
            values.push('</div><button class="btn btn-default" onclick="Validator.readMore(this)">Read more <i class="fa fa-angle-double-down"></i></button>');
            val = values.join(" ");
        }
        return val;
    }
    
    static readMore($this){
       const p = $this.parentNode;
       const moreText = $(p).children('.readMore');
       if($(moreText).hasClass('hidden')){
           $(moreText).removeClass('hidden');
           $this.innerHTML = "Read less <i class='fa fa-angle-double-up'></i>";
       }else{
           $(moreText).addClass('hidden');
           $this.innerHTML = "Read more <i class='fa fa-angle-double-down'></i>";
       }
       //const lessBtn = $(p).children('.readLessBtn');
   }
}

class Editor {
  static converter(value) {
    return value
      .replace(/\-#h1/g, "</h1>")
      .replace(/\#h1/g, "<h1>")
      .replace(/\-#h2/g, "</h2>")
      .replace(/\#h2/g, "<h2>")
      .replace(/\-#h3/g, "</h3>")
      .replace(/\#h3/g, "<h3>")
      .replace(/\-#h4/g, "</h4>")
      .replace(/\#h4/g, "<h4>")
      .replace(/\-#h5/g, "</h5>")
      .replace(/\#h5/g, "<h5>")
      .replace(/\-#b/g, "</b>")
      .replace(/\#b/g, "<b>")
      .replace(/\-#i/g, "</i>")
      .replace(/\#i/g, "</i>")
      .replace(/\-#u/g, "</ul>")
      .replace(/\#u/g, "<ul>")
      .replace(/\-#o/g, "</ol>")
      .replace(/\#o/g, "<ol>")
      .replace(/\-#l/g, "</li>")
      .replace(/\#l/g, "<li>")
      .replace(/\-#U/g, "</u>")
      .replace(/\#U/g, "<u>")
      .replace(/\\n/g, "<br />")
      .replace(/\-#mg/g, " alt=''/>")
      .replace(/\#mg/g, "<img class='editor-img' ")
      .replace(/\-#sup/g, "</sup>")
      .replace(/\#sup/g, "<sup>")
      .replace(/\-#sub/g, "</sub>")
      .replace(/\-#sob/g, "</sub>")
      .replace(/\#sub/g, "<sub>")
      .replace(/\#sob/g, "<sub style='position: relative; bottom: -8px; left: -5px;'>")
      .replace(/\-#pdf/g, " '></a>")
      .replace(/\#pdf/g, "<i class='fa  fa-file-pdf-o' style='font-size:35px'></i> download file <a class='fa fa-download' href='?n=download&s=")
      .replace(/\-#doc/g, " '></a>")
      .replace(/\#doc/g, "<i class='fa  fa-file-word-o' style='font-size:35px'></i> download file <a class='fa fa-download' href='?n=download&s=")
      .replace(/\-#xls/g, " '></a>")
      .replace(/\#xls/g, "<i class='fa  fa-file-excel-o' style='font-size:35px'></i> download file <a class='fa fa-download' href='?n=download&s=")
      .replace(/\-#p/g, "</p>")
      .replace(/\#p/g, "<p>");
  }
}