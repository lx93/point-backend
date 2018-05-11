export const sendSMS = async(dst,text) => {
    var options = {
      "method": "POST",
      "headers": {
        "authorization": "Basic TUFOSlpJTU1WSk4yUkhNWkUxTUo6Wldaa1ltSTRORFkyT1RFNE9EVTVOVFpsT0RabU16ZzBZbUUwWmpVeQ==",
        "content-type": "application/json",
        "cache-control": "no-cache",
        "postman-token": "f9688780-3c31-1db8-e2e7-c76f4cbd96fa"
      },
      "body": JSON.stringify({ src: '19198229889', dst: dst, text: text })
    };

    try {
      let response = await fetch('https://api.plivo.com/v1/Account/MANJZIMMVJN2RHMZE1MJ/Message/',options);
      let responseJson = await response.text();
      alert(responseJson);
    } catch (error) {console.error(error);}
}


export const smsGenerator = (giftValue,phoneNumber) => {
    return ("You have just received a $" + giftValue + " giftcard from Top of the Hill Chapel Hill! Recepient: " + phoneNumber)
}
