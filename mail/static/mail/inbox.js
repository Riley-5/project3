document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // When form is submitted send email
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#indiv-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function send_email() {
  // Get values for recipients, subject and body
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    console.log(recipients, subject, body);
    // Load user's sent mailbox
    load_mailbox('sent');
  })
  .catch((error) => {
    console.log('Error:', error);
  });
  // Prevent default submission
  return false;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#indiv-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get latest emails in mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    // Put each email in a div for sent mailbox
    emails.forEach(function(email) {
      const element = document.createElement('div');
      element.style.border = 'solid 1pt #000000';
      // If email has been read then make background white else make background grey
      if (email.read === false) {
        element.style.background = 'white';
      } else {
        element.style.background = 'grey';
      }
      element.innerHTML = `${email.sender} ${email.subject} ${email.timestamp}`; // Apply styling
      // When email is clicked
      element.addEventListener('click', function() {
        console.log(`This ${email.subject} has been clicked`)
        // Update what divs are showing. Only show div indiv_email
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.dsiplay = 'none';
        document.querySelector('#indiv-email').style.display = 'block';
        // Show email sender, recipients, subject, timestamp and body
        const indiv_email = document.createElement('div');
        indiv_email.innerHTML = `${email.sender} ${email.recipients} ${email.subject} ${email.timestamp} ${email.body}`;
        document.querySelector('#indiv-email').append(indiv_email); //remove append from div
        // Mark email as read
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
      });
      document.querySelector('#indiv-email').innerHTML = '';
      document.querySelector('#emails-view').append(element);
    });
  });
}