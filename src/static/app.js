document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("activity-search");
  let allActivities = {};

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .trim();
  }

  function matchesSearch(name, details, searchTerm) {
    if (!searchTerm) {
      return true;
    }

    const searchableText = [name, details.description, details.schedule]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm);
  }

  function renderActivities() {
    const searchTerm = normalizeText(searchInput.value);
    const filteredEntries = Object.entries(allActivities).filter(
      ([name, details]) => matchesSearch(name, details, searchTerm),
    );

    activitiesList.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "-- Select an activity --";
    activitySelect.replaceChildren(placeholderOption);

    if (filteredEntries.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-state";
      emptyState.textContent = "No activities match your search.";
      activitiesList.appendChild(emptyState);
      return;
    }

    filteredEntries.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
      `;

      const participantsSection = document.createElement("div");
      participantsSection.className = "participants-section";

      const participantsHeading = document.createElement("h5");
      participantsHeading.className = "participants-heading";
      participantsHeading.textContent = "Participants";

      const participantCount = document.createElement("span");
      participantCount.className = "participant-count";
      participantCount.textContent = details.participants.length;
      participantsHeading.appendChild(participantCount);
      participantsSection.appendChild(participantsHeading);

      const participantList = document.createElement("ul");
      participantList.className = "participant-list";

      if (details.participants.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "participant-empty";
        emptyMessage.textContent = "No participants yet";
        participantList.appendChild(emptyMessage);
      } else {
        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          participant.textContent = email;
          participantList.appendChild(participant);
        });
      }

      participantsSection.appendChild(participantList);
      activityCard.appendChild(participantsSection);
      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  searchInput.addEventListener("input", renderActivities);

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        },
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
