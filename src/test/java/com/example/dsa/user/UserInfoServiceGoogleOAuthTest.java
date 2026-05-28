package com.example.dsa.user;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserInfoServiceGoogleOAuthTest {

    @Mock
    private UserInfoRepository repository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void googleLoginCreatesUserWithoutUsernameAndEncodedPlaceholderPassword() {
        when(repository.findByEmail("saurabh@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any(String.class))).thenReturn("encoded-placeholder");
        when(repository.save(any(UserInfo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserInfoService service = new UserInfoService(repository, passwordEncoder);
        UserInfo user = service.findOrCreateGoogleUser(new GoogleOAuthService.GoogleProfile(
                "Saurabh@Example.com",
                "Saurabh Kumar",
                "https://example.com/avatar.png"));

        assertEquals("saurabh@example.com", user.getEmail());
        assertEquals("Saurabh Kumar", user.getName());
        assertEquals("https://example.com/avatar.png", user.getProfilePic());
        assertEquals("ROLE_USER", user.getRoles());
        assertEquals("encoded-placeholder", user.getPassword());
        assertNull(user.getUsername());

        ArgumentCaptor<UserInfo> saved = ArgumentCaptor.forClass(UserInfo.class);
        verify(repository).save(saved.capture());
        assertNotNull(saved.getValue().getPassword());
    }

    @Test
    void googleLoginReusesExistingUserWithoutOverwritingChosenUsername() {
        UserInfo existing = new UserInfo();
        existing.setEmail("saurabh@example.com");
        existing.setName("Saurabh");
        existing.setUsername("saurabhhhcodes");
        existing.setProfilePic("https://example.com/current.png");
        when(repository.findByEmail("saurabh@example.com")).thenReturn(Optional.of(existing));

        UserInfoService service = new UserInfoService(repository, passwordEncoder);
        UserInfo user = service.findOrCreateGoogleUser(new GoogleOAuthService.GoogleProfile(
                "saurabh@example.com",
                "Different Name",
                "https://example.com/new.png"));

        assertEquals("saurabhhhcodes", user.getUsername());
        assertEquals("Saurabh", user.getName());
        assertEquals("https://example.com/current.png", user.getProfilePic());
        verify(repository, never()).save(any(UserInfo.class));
    }
}
