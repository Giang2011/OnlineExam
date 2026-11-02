package com.gr1.exam.external.vision.service;

import com.gr1.exam.external.vision.config.VisionProperties;
import com.gr1.exam.external.vision.dto.VisionSheetGenerateResponseDTO;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Kiểm tra client sinh phiếu gửi đúng body JSON xuống Python service.
 */
class VisionSheetClientServiceTest {

    @Test
    void generateSheets_shouldPostJsonBodyToService() {
        VisionProperties properties = new VisionProperties();
        properties.setServiceUrl("http://localhost:8000");

        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

        server.expect(requestTo("http://localhost:8000/sheets/generate"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.examId").value("EXAM-501"))
                .andExpect(jsonPath("$.studentId").value("S001"))
                .andExpect(jsonPath("$.numQuestions").value(20))
                .andExpect(jsonPath("$.choicesPerQ").value(4))
                .andExpect(jsonPath("$.questionsPerPage").value(10))
                .andExpect(jsonPath("$.layout.margin_top").value(330))
                .andRespond(withSuccess(
                        "{\"examId\":\"EXAM-501\",\"studentId\":\"S001\",\"numQuestions\":20,"
                                + "\"choicesPerQ\":4,\"questionsPerPage\":10,\"pageCount\":2,"
                                + "\"pages\":[\"AAA\",\"BBB\"]}",
                        MediaType.APPLICATION_JSON));

        VisionSheetClientService service = new VisionSheetClientService(properties, restTemplate);

        VisionSheetGenerateResponseDTO response = service.generateSheets(
                "EXAM-501", "S001", 20, 4, 10,
                "{\"margin_top\":330,\"row_spacing\":56}");

        assertThat(response).isNotNull();
        assertThat(response.getPageCount()).isEqualTo(2);
        assertThat(response.getPages()).containsExactly("AAA", "BBB");
        server.verify();
    }

    @Test
    void generateSheets_shouldSendLayoutAsObject_whenLayoutIsValidJson() {
        VisionProperties properties = new VisionProperties();
        properties.setServiceUrl("http://localhost:8000");

        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();

        server.expect(requestTo("http://localhost:8000/sheets/generate"))
                .andExpect(jsonPath("$.layout").isMap())
                .andRespond(withSuccess("{\"pages\":[\"AAA\"]}", MediaType.APPLICATION_JSON));

        VisionSheetClientService service = new VisionSheetClientService(properties, restTemplate);
        service.generateSheets("EXAM-1", null, 5, 4, 5, "{\"margin_top\":330}");

        server.verify();
    }
}
