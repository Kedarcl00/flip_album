async function login(){

    const password =
    document.getElementById("password").value;

    const message =
    document.getElementById("message");

    try{

        const response =
        await fetch(

        "https://tirthas-bday.onrender.com/api/auth/login",

        {

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                password:password
            })

        });

        const data =
        await response.json();

        console.log(data);

        if(data.success){

            localStorage.setItem(
                "token",
                data.token
            );

            message.innerHTML =
            "Login Successful";

            message.style.color =
            "lightgreen";

            setTimeout(() => {

                window.location.href =
                "admin.html";

            },1000);

        }else{

            message.innerHTML =
            data.message;

            message.style.color =
            "red";

        }

    }catch(error){

        console.log(error);

        message.innerHTML =
        "Server Error";

    }

}