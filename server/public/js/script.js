var emailIndex = -1;
var phoneIndex = -1;
var addressIndex = -1;
var socialIndex = -1;
var inviteEmails = [];

function addEmail(index){
    if(parseInt(index) > emailIndex){
        ind = parseInt(index);
        emailIndex = ind;
    }else{
        ind = emailIndex + 1;
        emailIndex = ind;
    }
    document.getElementById('emails').innerHTML += '<div id="email-'+ ind +'" class="row mb-3"><div class="form-floating col-2"><select class="form-select" name="email"><option value="work">work</option><option value="school">school</option><option value="home">home</option></select><label for="email">Type</label></div><div class="form-floating col-9"><input type="text" class="form-control" placeholder="Title" name="title"><label for="title">Email</label></div><div class="col-1 d-flex align-middle"><button type="button" class="btn text-secondary" onmouseover="this.classList.remove(\'text-secondary\')" onmouseout="this.classList.add(\'text-secondary\')" onclick="delEmail(\'email-'+ ind +'\')"><i class="bi bi-trash3 text-center fs-5"></i></button></div></div>';
}

function addPhone(index){
    if(parseInt(index) > phoneIndex){
        ind = parseInt(index);
        phoneIndex = ind;
    }else{
        ind = phoneIndex + 1;
        phoneIndex = ind;
    }
    document.getElementById('phones').innerHTML += '<div id="phone-'+ ind +'" class="row mb-3"><div class="form-floating col-2"><select class="form-select" name="phoneType"><option value="work">work</option><option value="school">school</option><option value="home">home</option></select><label for="phone">Type</label></div><div class="form-floating col-9"><input type="text" class="form-control" name="phone"><label for="phone">Phone</label></div><div class="col-1 d-flex align-middle"><button type="button" class="btn text-secondary" onmouseover="this.classList.remove(\'text-secondary\')" onmouseout="this.classList.add(\'text-secondary\')" onclick="del(\'phone-'+ ind +'\')"><i class="bi bi-trash3 text-center fs-5"></i></button></div></div>';
}

function addSocial(index){
    if(parseInt(index) > socialIndex){
        ind = parseInt(index);
        socialIndex = ind;
    }else{
        ind = socialIndex + 1;
        socialIndex = ind;
    }
    document.getElementById('socials').innerHTML += '<div id="social-'+ ind +'" class="row mb-3"><div class="form-floating col-2"><select class="form-select" name="socialType"><option value="LinkedIn">LinkedIn</option><option value="Instagram">Instagram</option><option value="Twitter">Twitter</option><option value="Facebook">Facebook</option><option value="TikTok">TikTok</option><option value="ForeverBuffs">ForeverBuffs</option><option value="Github">Github</option><option value="Snapchat">Snapchat</option></select><label for="socialType">Type</label></div><div class="form-floating col-9"><input type="text" class="form-control" name="url"><label for="url">URL</label></div><div class="col-1 d-flex align-middle"><button type="button" class="btn text-secondary"onmouseover="this.classList.remove(\'text-secondary\')"onmouseout="this.classList.add(\'text-secondary\')"onclick="del(\'social-'+ ind +'\')"><i class="bi bi-trash3 text-center fs-5"></i></button></div></div>';
}

function addAddress(index){
    if(parseInt(index) > addressIndex){
        ind = parseInt(index);
        addressIndex = ind;
    }else{
        ind = addressIndex + 1;
        addressIndex = ind;
    }
    document.getElementById('addresses').innerHTML += '<div id="address-'+ ind +'" class="row mb-3"><div class="col-11"><div class="form-floating mb-3"><select class="form-select" name="addressType"><option value="home">home</option><option value="work">work</option><option value="school">school</option></select><label for="addressType">Type</label></div><div class="form-floating mb-3"><input type="text" class="form-control" id="address_line1" name="address_line1" required><label for="address_line1">Address Line 1</label></div><div class="form-floating mb-3"><input type="text" class="form-control" id="address_line2" name="address_line2"><label for="address_line1">Address Line 2</label></div><div class="row mb-3"><div class="form-floating col-5"><input type="text" class="form-control" id="address_line1" name="city"><label for="city">City</label></div><div class="form-floating col-3"><select class="form-control" name="state"><option value="AL">AL</option><option value="AK">AK</option><option value="AR">AR</option><option value="AZ">AZ</option><option value="CA">CA</option><option value="CO">CO</option><option value="CT">CT</option><option value="DC">DC</option><option value="DE">DE</option><option value="FL">FL</option><option value="GA">GA</option><option value="HI">HI</option><option value="IA">IA</option><option value="ID">ID</option><option value="IL">IL</option><option value="IN">IN</option><option value="KS">KS</option><option value="KY">KY</option><option value="LA">LA</option><option value="MA">MA</option<option value="MD">MD</option><option value="ME">ME</option><option value="MI">MI</option><option value="MN">MN</option><option value="MO">MO</option><option value="MS">MS</option><option value="MT">MT</option><option value="NC">NC</option><option value="NE">NE</option><option value="NH">NH</option><option value="NJ">NJ</option><option value="NM">NM</option><option value="NV">NV</option><option value="NY">NY</option><option value="ND">ND</option<option value="OH">OH</option><option value="OK">OK</option><option value="OR">OR</option><option value="PA">PA</option><option value="RI">RI</option><option value="SC">SC</option><option value="SD">SD</option><option value="TN">TN</option><option value="TX">TX</option><option value="UT">UT</option><option value="VT">VT</option><option value="VA">VA</option><option value="WA">WA</option><option value="WI">WI</option><option value="WV">WV</option><option value="WY">WY</option></select><label for="state">State</label></div><div class="form-floating col-4"><input type="text" class="form-control" id="address_line1" name="zipcode"><label for="zipcode">Postal Code</label></div></div></div><div class="col-1 d-flex align-middle"><button type="button" class="btn text-secondary"onmouseover="this.classList.remove(\'text-secondary\')"onmouseout="this.classList.add(\'text-secondary\')"onclick="del(\'address-'+ ind +'\')"><i class="bi bi-trash3 text-center fs-5"></i></button></div></div>';
}

function del(id){
    element = document.getElementById(id);
    element.parentElement.removeChild(element);
}

function del_(id){
    inviteEmails.forEach((email, index) => {
        if(email.id == id){
            element = document.getElementById('email-' + email.id);
            element.parentElement.removeChild(element);
            inviteEmails.splice(index,1);
        }
    });
    
}

function add_invite_email(){
    inviteEmails.push({value: document.getElementById('email-value').value, id: inviteEmails.length + 1});
    document.getElementById('email-body').innerHTML += '<div id="email-' + inviteEmails.length + '" class="bg-light shadow-sm rounded-pill px-3 d-flex justify-content-between m-2"><span class="d-flex flex-column justify-content-center">' + document.getElementById('email-value').value + '</span><button class="btn" onclick="del_(' + inviteEmails.length + ')"><i class="bi bi-trash3 text-center fs-6"></i></button></div>';
    document.getElementById('email-value').value = '';
}

function clear_emails(){
    var index = 1;
    while(inviteEmails.length > 0){
        del_(index);
        index++;
    }
}

function send_emails(){
    fetch('/invite', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteEmails)
    }).then(() => {
        clear_emails();
    })
    .catch(err => {
        console.log(err);
    });
}

function permissions(pid){
    fetch('/permissions/' + pid, {
        method: 'GET'
    }).then((data) => {
        if(data.permissions == 'admn'){
            document.getElementById('permission_option').setAttribute('value', 'Admin');
            document.getElementById('permission_option').innerHTML = 'Admin';
        }else if(data.permissions == 'user'){
            document.getElementById('permission_option').setAttribute('value','User');
            document.getElementById('permission_option').innerHTML = 'User';
        }else {
            document.getElementById('permission_option').setAttribute('value', 'Owner');
            document.getElementById('permission_option').innerHTML = 'Owner';
        }
    })
    .catch(err => {
        console.log(err);
    });
}

async function delProfile(pid){
    fetch('/delete', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
          },
        body: JSON.stringify({profile_id: pid})
    });
}

document.getElementById('fileUpload').onchange = event => {
    const [file] = document.getElementById('fileUpload').files;
    if(file){
        document.getElementById('prof_picture').style.backgroundImage = 'url('+ URL.createObjectURL(file) +')';
    }
}