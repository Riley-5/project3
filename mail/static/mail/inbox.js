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
      element.id = '#element-email';

      element.style.border = '1px solid black';
      
      element.innerHTML = `<span id="email-sender">${email.sender}</span><span id="email-subject">${email.subject}</span>${email.timestamp}`;

      // If email has been read then make background white else make background grey
      if (email.read === true) {
        element.classList.add('email-read');
      }

      // When email is clicked
      element.addEventListener('click', function() {
        console.log(`This ${email.subject} has been clicked`);
        // Update what divs are showing. Only show div indiv_email
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.dsiplay = 'none';
        document.querySelector('#indiv-email').style.display = 'block';
        // Show email sender, recipients, subject, timestamp and body
        const indiv_email = document.createElement('div');
        indiv_email.innerHTML = `<div id="indiv-from"><b>From:</b> ${email.sender}</div> 
        <div id="indiv-to"><b>To:</b> ${email.recipients}</div> 
        <div id="indiv-subject"><b>Subject:</b> ${email.subject}</div> 
        <div id="indiv-timestamp"><b>Timestamp:</b> ${email.timestamp}</div> 
        <hr/> 
        <div id="indiv-body">${email.body}</div>`;
        document.querySelector('#indiv-email').append(indiv_email);

        // Mark email as read
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })

        // Add reply buttton
        const reply_button = document.createElement('button');
        reply_button.innerHTML = 'Reply';
        reply_button.type = 'submit';
        reply_button.id = 'btnReply';
        document.querySelector('#indiv-email').append(reply_button);
        document.querySelector('#btnReply').onclick = function() {
          fetch(`/emails/${email.id}`)
          .then(response => response.json())
          .then(email => {
            console.log(email);
            document.querySelector('#compose-recipients').value = email.sender;
            if (email.subject.startsWith('Re:')) {
              document.querySelector('#compose-subject').value = email.subject;
            }
            else {
              document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
            }
            if (email.body.startsWith('On')) {
              document.querySelector('#compose-body').value = email.body;
            }
            else {
              document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
            }
          });
          compose_email();
        }

        // If email is from inbox mailbox add archive button
        if (mailbox === 'inbox') {
          // Add archive button
          const archive_button = document.createElement('button');
          archive_button.innerHTML = 'Archive';
          archive_button.type = 'submit';
          archive_button.id = 'btnArchive';
          document.querySelector('#indiv-email').append(archive_button);
          // If archive button clicked remove email from inbox add it to archived emails
          function archive() {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: true
              })
            })
            load_mailbox('inbox');
          }

          document.querySelector('#btnArchive').onclick = archive;
        }
        else if (mailbox === 'archive') {
          // Add unarchive button
          const unarchive_button = document.createElement('button');
          unarchive_button.innerHTML = 'Unarchive';
          unarchive_button.type = 'submit';
          unarchive_button.id = 'btnUnarchive';
          document.querySelector('#indiv-email').append(unarchive_button);
          // If archive button clicked remove email from inbox add it to archived emails
          function unarchive() {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: false
              })
            })
            load_mailbox('inbox');
          }

          document.querySelector('#btnUnarchive').onclick = unarchive;
        }
      });
      document.querySelector('#indiv-email').innerHTML = '';
      document.querySelector('#emails-view').append(element);
    });
  });
}